import type { SearchFilters, SearchState } from './types';
import { DEFAULT_SEARCH_FILTERS } from './types';

const STORAGE_KEY = 'axionvera:search:state';
const STORAGE_VERSION = 1;

interface PersistedSearchState {
  version: number;
  query: string;
  filters: SearchFilters;
}

export function loadSearchState(): Pick<SearchState, 'query' | 'filters'> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedSearchState;
    if (parsed.version !== STORAGE_VERSION) return null;

    return {
      query: parsed.query ?? '',
      filters: parsed.filters ?? DEFAULT_SEARCH_FILTERS,
    };
  } catch {
    return null;
  }
}

export function saveSearchState(state: Pick<SearchState, 'query' | 'filters'>): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: PersistedSearchState = {
      version: STORAGE_VERSION,
      query: state.query,
      filters: state.filters,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or serialization errors.
  }
}

export function clearSearchState(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
