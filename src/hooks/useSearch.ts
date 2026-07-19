import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import { getEventIndexer } from '@/indexing/eventIndexer';
import { activityStore } from '@/store/activityStore';
import { searchStore } from '@/store/searchStore';
import { getSearchIndex } from '@/search/indexBuilder';
import { getSearchService } from '@/search/searchService';
import type { SearchIndexInput, SearchQuery, SearchResult } from '@/search/types';
import type { VaultTx } from '@/utils/contractHelpers';
import type { Proposal } from '@/utils/contractHelpersGovernance';
import type { VaultBalances } from '@/utils/contractHelpers';

export interface UseSearchArgs {
  transactions?: VaultTx[];
  vaultBalances?: VaultBalances | null;
  proposals?: Proposal[];
  /** When true, include events from the shared event indexer. */
  includeIndexerEvents?: boolean;
  pageSize?: number;
}

export interface UseSearchReturn {
  query: string;
  filters: ReturnType<typeof searchStore.getSnapshot>['filters'];
  isOpen: boolean;
  result: SearchResult;
  indexSize: number;
  setQuery: (query: string) => void;
  setFilters: (filters: ReturnType<typeof searchStore.getSnapshot>['filters']) => void;
  updateFilters: (partial: Partial<ReturnType<typeof searchStore.getSnapshot>['filters']>) => void;
  clearFilters: () => void;
  setOpen: (open: boolean) => void;
  reset: () => void;
}

/**
 * React hook for global dashboard search.
 * Rebuilds the index when source data changes and executes queries via SearchService.
 */
export function useSearch({
  transactions = [],
  vaultBalances = null,
  proposals = [],
  includeIndexerEvents = true,
  pageSize = 20,
}: UseSearchArgs = {}): UseSearchReturn {
  const storeState = useSyncExternalStore(
    searchStore.subscribe,
    searchStore.getSnapshot,
    searchStore.getSnapshot,
  );

  const activityState = useSyncExternalStore(
    activityStore.subscribe,
    activityStore.getSnapshot,
    activityStore.getSnapshot,
  );

  useEffect(() => {
    searchStore.hydrate();
  }, []);

  const indexInput = useMemo((): SearchIndexInput => {
    const indexerEvents = includeIndexerEvents
      ? getEventIndexer().query({ limit: 500 }).events
      : [];

    const activityEvents = [
      ...activityState.events,
      ...indexerEvents.filter((e) => !activityState.events.some((a) => a.id === e.id)),
    ];

    return {
      transactions,
      vaultBalances,
      proposals,
      activityEvents,
    };
  }, [transactions, vaultBalances, proposals, includeIndexerEvents, activityState.events]);

  const index = useMemo(() => {
    const searchIndex = getSearchIndex();
    searchIndex.rebuild(indexInput);
    const service = getSearchService();
    service.setIndex(searchIndex);
    return searchIndex;
  }, [indexInput]);

  const searchQuery = useMemo((): SearchQuery => ({
    text: storeState.query,
    filters: storeState.filters,
    pagination: { page: 1, pageSize },
    fuzzy: true,
    sort: storeState.query
      ? { field: 'relevance', direction: 'desc' }
      : { field: 'timestamp', direction: 'desc' },
  }), [storeState.query, storeState.filters, pageSize]);

  const result = useMemo(
    () => getSearchService().search(searchQuery),
    [searchQuery, index],
  );

  const setQuery = useCallback((query: string) => searchStore.setQuery(query), []);
  const setFilters = useCallback(
    (filters: ReturnType<typeof searchStore.getSnapshot>['filters']) => searchStore.setFilters(filters),
    [],
  );
  const updateFilters = useCallback(
    (partial: Partial<ReturnType<typeof searchStore.getSnapshot>['filters']>) =>
      searchStore.updateFilters(partial),
    [],
  );
  const clearFilters = useCallback(() => searchStore.clearFilters(), []);
  const setOpen = useCallback((open: boolean) => searchStore.setOpen(open), []);
  const reset = useCallback(() => searchStore.reset(), []);

  return {
    query: storeState.query,
    filters: storeState.filters,
    isOpen: storeState.isOpen,
    result,
    indexSize: index.size,
    setQuery,
    setFilters,
    updateFilters,
    clearFilters,
    setOpen,
    reset,
  };
}
