import type { ActivityEvent } from '@/services/events/types';
import type { VaultTx, VaultBalances } from '@/utils/contractHelpers';
import type { Proposal } from '@/utils/contractHelpersGovernance';

/** Entity categories searchable across the dashboard. */
export type SearchEntityType =
  | 'transaction'
  | 'vault'
  | 'proposal'
  | 'reward'
  | 'activity';

/** Normalized document stored in the search index. */
export interface SearchDocument {
  id: string;
  entityType: SearchEntityType;
  title: string;
  subtitle?: string;
  /** Concatenated lowercase fields used for text matching. */
  searchableText: string;
  timestamp?: string;
  status?: string;
  route: string;
  score?: number;
  payload: VaultTx | VaultBalances | Proposal | ActivityEvent | RewardPayload;
}

export interface RewardPayload {
  id: string;
  amount: string;
  claimedAt: string;
  hash?: string;
}

/** Advanced filter options that combine with AND semantics. */
export interface SearchFilters {
  entityTypes?: SearchEntityType[];
  status?: string[];
  startDate?: string;
  endDate?: string;
  contractIds?: string[];
}

export type SearchSortField = 'relevance' | 'timestamp';
export type SearchSortDirection = 'asc' | 'desc';

export interface SearchQuery {
  text?: string;
  filters?: SearchFilters;
  sort?: { field: SearchSortField; direction: SearchSortDirection };
  pagination?: { page: number; pageSize: number };
  /** Enable fuzzy matching (default: true when text is present). */
  fuzzy?: boolean;
}

export interface SearchResult {
  documents: SearchDocument[];
  total: number;
  page: number;
  pageSize: number;
  queryMs: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  byEntityType: Record<SearchEntityType, number>;
}

export interface SearchIndexInput {
  transactions?: VaultTx[];
  vaultBalances?: VaultBalances | null;
  proposals?: Proposal[];
  activityEvents?: ActivityEvent[];
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  isOpen: boolean;
  lastUpdated: number | null;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {};

export const SEARCH_ENTITY_LABELS: Record<SearchEntityType, string> = {
  transaction: 'Transactions',
  vault: 'Vault',
  proposal: 'Proposals',
  reward: 'Rewards',
  activity: 'Protocol Activity',
};
