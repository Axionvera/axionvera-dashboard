import { clearSearchState, loadSearchState, saveSearchState } from '@/search/persistence';
import type { SearchFilters, SearchState } from '@/search/types';
import { DEFAULT_SEARCH_FILTERS } from '@/search/types';

const INITIAL_STATE: SearchState = {
  query: '',
  filters: DEFAULT_SEARCH_FILTERS,
  isOpen: false,
  lastUpdated: null,
};

/**
 * Observable store for global search UI state.
 * Query and filters persist in sessionStorage across navigation.
 */
export class SearchStore {
  private state: SearchState = { ...INITIAL_STATE };
  private readonly listeners = new Set<() => void>();
  private hydrated = false;

  constructor() {
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): SearchState {
    return this.state;
  }

  hydrate(): void {
    if (this.hydrated || typeof window === 'undefined') return;
    this.hydrated = true;

    const persisted = loadSearchState();
    if (!persisted) return;

    this.state = {
      ...this.state,
      query: persisted.query,
      filters: persisted.filters,
      lastUpdated: Date.now(),
    };
    this.emit();
  }

  setQuery(query: string): void {
    this.state = { ...this.state, query, lastUpdated: Date.now() };
    saveSearchState({ query: this.state.query, filters: this.state.filters });
    this.emit();
  }

  setFilters(filters: SearchFilters): void {
    this.state = { ...this.state, filters, lastUpdated: Date.now() };
    saveSearchState({ query: this.state.query, filters: this.state.filters });
    this.emit();
  }

  updateFilters(partial: Partial<SearchFilters>): void {
    this.setFilters({ ...this.state.filters, ...partial });
  }

  clearFilters(): void {
    this.setFilters(DEFAULT_SEARCH_FILTERS);
  }

  setOpen(isOpen: boolean): void {
    this.state = { ...this.state, isOpen, lastUpdated: Date.now() };
    this.emit();
  }

  reset(): void {
    clearSearchState();
    this.state = { ...INITIAL_STATE, lastUpdated: Date.now() };
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((cb) => cb());
  }
}

export const searchStore = new SearchStore();
