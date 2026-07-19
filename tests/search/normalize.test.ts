import type { ActivityEvent } from '@/services/events/types';
import type { VaultTx } from '@/utils/contractHelpers';
import type { Proposal } from '@/utils/contractHelpersGovernance';

import { buildSearchIndex } from '@/search/indexBuilder';
import {
  normalizeActivity,
  normalizeProposal,
  normalizeTransaction,
  normalizeVault,
} from '@/search/normalize';

const sampleTx: VaultTx = {
  id: 'tx-1',
  type: 'deposit',
  amount: '100',
  status: 'success',
  createdAt: '2025-06-01T10:00:00.000Z',
  hash: 'abc123',
};

const sampleProposal: Proposal = {
  id: 'prop-1',
  title: 'Increase quorum threshold',
  description: 'Raise quorum to 40%',
  proposer: 'GABC123',
  status: 'active',
  createdAt: '2025-06-02T10:00:00.000Z',
  endsAt: '2025-06-09T10:00:00.000Z',
  executedAt: null,
  votesFor: '1000',
  votesAgainst: '200',
  votesAbstain: '50',
  quorum: '40',
  threshold: '50',
  actions: [],
  metadataUri: null,
};

const sampleActivity: ActivityEvent = {
  id: 'evt-1',
  type: 'deposit',
  name: 'deposit',
  contractId: 'CONTRACT123',
  ledger: 12345,
  timestamp: '2025-06-03T10:00:00.000Z',
  topics: ['deposit'],
  value: { amount: '50' },
};

describe('search normalize', () => {
  it('normalizes vault transactions with searchable fields', () => {
    const doc = normalizeTransaction(sampleTx);
    expect(doc.entityType).toBe('transaction');
    expect(doc.searchableText).toContain('deposit');
    expect(doc.searchableText).toContain('abc123');
    expect(doc.route).toBe('/dashboard');
  });

  it('normalizes proposals with title and proposer', () => {
    const doc = normalizeProposal(sampleProposal);
    expect(doc.entityType).toBe('proposal');
    expect(doc.searchableText).toContain('quorum');
    expect(doc.searchableText).toContain('gabc123');
  });

  it('normalizes vault balances', () => {
    const doc = normalizeVault({ balance: '500', rewards: '25' });
    expect(doc.entityType).toBe('vault');
    expect(doc.searchableText).toContain('500');
    expect(doc.searchableText).toContain('25');
  });

  it('normalizes protocol activity events', () => {
    const doc = normalizeActivity(sampleActivity);
    expect(doc.entityType).toBe('activity');
    expect(doc.searchableText).toContain('contract123');
    expect(doc.searchableText).toContain('deposit');
  });
});

describe('buildSearchIndex', () => {
  it('builds a deduplicated index from all sources', () => {
    const claimTx: VaultTx = {
      id: 'tx-claim',
      type: 'claim',
      amount: '10',
      status: 'success',
      createdAt: '2025-06-04T10:00:00.000Z',
    };

    const docs = buildSearchIndex({
      transactions: [sampleTx, claimTx],
      vaultBalances: { balance: '500', rewards: '25' },
      proposals: [sampleProposal],
      activityEvents: [sampleActivity],
    });

    expect(docs.length).toBeGreaterThanOrEqual(5);
    expect(docs.some((d) => d.entityType === 'transaction')).toBe(true);
    expect(docs.some((d) => d.entityType === 'reward')).toBe(true);
    expect(docs.some((d) => d.entityType === 'proposal')).toBe(true);
    expect(docs.some((d) => d.entityType === 'activity')).toBe(true);
    expect(docs.some((d) => d.entityType === 'vault')).toBe(true);
  });
});
