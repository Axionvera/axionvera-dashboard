import type { ActivityEvent } from '@/services/events/types';
import type { VaultTx } from '@/utils/contractHelpers';
import type { Proposal } from '@/utils/contractHelpersGovernance';

import { SearchIndex } from '@/search/indexBuilder';
import { SearchService, benchmarkSearch } from '@/search/searchService';

const transactions: VaultTx[] = [
  { id: '1', type: 'deposit', amount: '100', status: 'success', createdAt: '2025-06-01T10:00:00.000Z' },
  { id: '2', type: 'withdraw', amount: '50', status: 'pending', createdAt: '2025-06-02T10:00:00.000Z' },
  { id: '3', type: 'claim', amount: '5', status: 'success', createdAt: '2025-06-03T10:00:00.000Z', hash: 'reward-hash' },
];

const proposals: Proposal[] = [
  {
    id: 'p1',
    title: 'Upgrade vault contract',
    description: 'Deploy new vault implementation',
    proposer: 'GALICE',
    status: 'active',
    createdAt: '2025-06-01T12:00:00.000Z',
    endsAt: '2025-06-08T12:00:00.000Z',
    executedAt: null,
    votesFor: '500',
    votesAgainst: '100',
    votesAbstain: '20',
    quorum: '30',
    threshold: '50',
    actions: [],
    metadataUri: null,
  },
  {
    id: 'p2',
    title: 'Fee parameter change',
    description: 'Reduce protocol fees',
    proposer: 'GBOB',
    status: 'passed',
    createdAt: '2025-05-20T12:00:00.000Z',
    endsAt: '2025-05-27T12:00:00.000Z',
    executedAt: '2025-05-28T12:00:00.000Z',
    votesFor: '800',
    votesAgainst: '50',
    votesAbstain: '10',
    quorum: '30',
    threshold: '50',
    actions: [],
    metadataUri: null,
  },
];

const activityEvents: ActivityEvent[] = [
  {
    id: 'e1',
    type: 'governance',
    name: 'vote',
    contractId: 'GOV_CONTRACT',
    ledger: 999,
    timestamp: '2025-06-04T10:00:00.000Z',
    topics: ['vote'],
    value: {},
  },
];

function createService(): SearchService {
  const index = new SearchIndex();
  index.rebuild({ transactions, proposals, activityEvents, vaultBalances: { balance: '200', rewards: '15' } });
  const service = new SearchService();
  service.setIndex(index);
  return service;
}

describe('SearchService', () => {
  it('returns all documents when no query or filters are set', () => {
    const service = createService();
    const result = service.search();
    expect(result.total).toBeGreaterThan(0);
    expect(result.documents.length).toBeGreaterThan(0);
  });

  it('filters by entity type', () => {
    const service = createService();
    const result = service.search({ filters: { entityTypes: ['proposal'] } });
    expect(result.total).toBe(2);
    expect(result.documents.every((d) => d.entityType === 'proposal')).toBe(true);
  });

  it('combines text search with entity type filters', () => {
    const service = createService();
    const result = service.search({
      text: 'vault',
      filters: { entityTypes: ['proposal'] },
    });
    expect(result.total).toBe(1);
    expect(result.documents[0].title).toContain('vault');
  });

  it('filters by status', () => {
    const service = createService();
    const result = service.search({ filters: { status: ['active'] } });
    expect(result.documents.every((d) => d.status === 'active')).toBe(true);
  });

  it('filters by date range', () => {
    const service = createService();
    const result = service.search({
      filters: {
        startDate: '2025-06-01T00:00:00.000Z',
        endDate: '2025-06-03T23:59:59.999Z',
      },
    });
    expect(result.total).toBeGreaterThan(0);
    for (const doc of result.documents) {
      if (!doc.timestamp) continue;
      const ts = new Date(doc.timestamp).getTime();
      expect(ts).toBeGreaterThanOrEqual(new Date('2025-06-01').getTime());
      expect(ts).toBeLessThanOrEqual(new Date('2025-06-03T23:59:59.999Z').getTime());
    }
  });

  it('supports fuzzy text matching', () => {
    const service = createService();
    const exact = service.search({ text: 'upgrade vault' });
    const fuzzy = service.search({ text: 'upgrde vault', fuzzy: true });
    expect(exact.total).toBeGreaterThan(0);
    expect(fuzzy.total).toBeGreaterThan(0);
  });

  it('paginates results', () => {
    const service = createService();
    const page1 = service.search({ pagination: { page: 1, pageSize: 2 } });
    const page2 = service.search({ pagination: { page: 2, pageSize: 2 } });
    expect(page1.documents).toHaveLength(2);
    expect(page1.page).toBe(1);
    expect(page2.documents.length).toBeGreaterThan(0);
  });

  it('computes entity type facets', () => {
    const service = createService();
    const result = service.search();
    expect(result.facets.byEntityType.proposal).toBe(2);
    expect(result.facets.byEntityType.reward).toBe(1);
  });

  it('completes queries within responsive time bounds', () => {
    const service = createService();
    const bench = benchmarkSearch(service, { text: 'vault' }, 20);
    expect(bench.avgMs).toBeLessThan(50);
  });
});
