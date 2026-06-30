export type {
  SearchDocument,
  SearchEntityType,
  SearchFilters,
  SearchIndexInput,
  SearchQuery,
  SearchResult,
  SearchState,
} from './types';
export {
  DEFAULT_SEARCH_FILTERS,
  SEARCH_ENTITY_LABELS,
} from './types';

export { fuzzyMatch, fuzzyScore, levenshtein, normalizeText, tokenize } from './fuzzy';
export {
  dedupeDocuments,
  normalizeActivity,
  normalizeProposal,
  normalizeReward,
  normalizeTransaction,
  normalizeVault,
} from './normalize';
export { buildSearchIndex, getSearchIndex, SearchIndex } from './indexBuilder';
export {
  benchmarkSearch,
  getSearchService,
  SearchService,
} from './searchService';
export { clearSearchState, loadSearchState, saveSearchState } from './persistence';
