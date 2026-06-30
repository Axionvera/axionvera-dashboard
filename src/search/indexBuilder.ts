import type { SearchDocument, SearchIndexInput } from './types';
import {
  dedupeDocuments,
  normalizeActivity,
  normalizeProposal,
  normalizeReward,
  normalizeTransaction,
  normalizeVault,
} from './normalize';

/**
 * Build a unified search index from dashboard data sources.
 *
 * Indexing strategy:
 * - Transactions and reward claims are indexed from vault SDK data.
 * - Vault balances produce a single navigational document.
 * - Governance proposals are indexed individually.
 * - Protocol activity events come from the event indexer / activity feed.
 * - Documents are deduplicated by stable composite ids.
 */
export function buildSearchIndex(input: SearchIndexInput): SearchDocument[] {
  const docs: SearchDocument[] = [];

  if (input.transactions) {
    for (const tx of input.transactions) {
      if (tx.type === 'claim') {
        docs.push(normalizeReward(tx));
      } else {
        docs.push(normalizeTransaction(tx));
      }
    }
  }

  if (input.vaultBalances) {
    docs.push(normalizeVault(input.vaultBalances));
  }

  if (input.proposals) {
    for (const proposal of input.proposals) {
      docs.push(normalizeProposal(proposal));
    }
  }

  if (input.activityEvents) {
    for (const event of input.activityEvents) {
      docs.push(normalizeActivity(event));
    }
  }

  return dedupeDocuments(docs);
}

/** In-memory index holder with incremental rebuild support. */
export class SearchIndex {
  private documents: SearchDocument[] = [];

  rebuild(input: SearchIndexInput): SearchDocument[] {
    this.documents = buildSearchIndex(input);
    return this.documents;
  }

  getDocuments(): readonly SearchDocument[] {
    return this.documents;
  }

  get size(): number {
    return this.documents.length;
  }

  clear(): void {
    this.documents = [];
  }
}

let sharedIndex: SearchIndex | null = null;

export function getSearchIndex(): SearchIndex {
  if (!sharedIndex) {
    sharedIndex = new SearchIndex();
  }
  return sharedIndex;
}
