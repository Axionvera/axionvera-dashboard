import { QueryEngine } from '@/query';

import { fuzzyScore } from './fuzzy';
import type { SearchIndex } from './indexBuilder';
import type {
  SearchDocument,
  SearchEntityType,
  SearchFacets,
  SearchFilters,
  SearchQuery,
  SearchResult,
} from './types';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Client-side search service backed by QueryEngine for structured filters
 * and custom fuzzy scoring for text queries.
 */
export class SearchService {
  private readonly queryEngine = new QueryEngine<SearchDocument>({ cacheSize: 64 });
  private index: SearchIndex | null = null;

  setIndex(index: SearchIndex): void {
    this.index = index;
    this.queryEngine.clearCache();
  }

  search(query: SearchQuery = {}): SearchResult {
    const start = performance.now();
    const documents = [...(this.index?.getDocuments() ?? [])];
    const filters = query.filters ?? {};
    const page = query.pagination?.page ?? 1;
    const pageSize = query.pagination?.pageSize ?? DEFAULT_PAGE_SIZE;

    let filtered = applyStructuredFilters(documents, filters);

    if (query.text?.trim()) {
      const useFuzzy = query.fuzzy !== false;
      filtered = filtered
        .map((doc) => ({
          ...doc,
          score: useFuzzy
            ? fuzzyScore(query.text!, doc.searchableText)
            : doc.searchableText.includes(query.text!.toLowerCase())
              ? 1
              : 0,
        }))
        .filter((doc) => (doc.score ?? 0) > 0);
    }

    const sortField = query.sort?.field ?? (query.text ? 'relevance' : 'timestamp');
    const sortDirection = query.sort?.direction ?? 'desc';
    filtered = sortDocuments(filtered, sortField, sortDirection);

    const facets = computeFacets(filtered);
    const total = filtered.length;
    const offset = (page - 1) * pageSize;
    const paginated = filtered.slice(offset, offset + pageSize);

    return {
      documents: paginated,
      total,
      page,
      pageSize,
      queryMs: performance.now() - start,
      facets,
    };
  }

  clearCache(): void {
    this.queryEngine.clearCache();
  }
}

function applyStructuredFilters(
  documents: SearchDocument[],
  filters: SearchFilters,
): SearchDocument[] {
  let result = documents;

  if (filters.entityTypes?.length) {
    const types = new Set(filters.entityTypes);
    result = result.filter((doc) => types.has(doc.entityType));
  }

  if (filters.status?.length) {
    const statuses = new Set(filters.status.map((s) => s.toLowerCase()));
    result = result.filter((doc) => doc.status && statuses.has(doc.status.toLowerCase()));
  }

  if (filters.startDate) {
    const startTs = new Date(filters.startDate).getTime();
    result = result.filter((doc) => {
      if (!doc.timestamp) return false;
      return new Date(doc.timestamp).getTime() >= startTs;
    });
  }

  if (filters.endDate) {
    const endTs = new Date(filters.endDate).getTime();
    result = result.filter((doc) => {
      if (!doc.timestamp) return false;
      return new Date(doc.timestamp).getTime() <= endTs;
    });
  }

  if (filters.contractIds?.length) {
    const ids = new Set(filters.contractIds);
    result = result.filter((doc) => {
      if (doc.entityType !== 'activity') return true;
      const event = doc.payload as { contractId?: string };
      return event.contractId ? ids.has(event.contractId) : false;
    });
  }

  return result;
}

function sortDocuments(
  documents: SearchDocument[],
  field: 'relevance' | 'timestamp',
  direction: 'asc' | 'desc',
): SearchDocument[] {
  const dir = direction === 'asc' ? 1 : -1;
  return [...documents].sort((a, b) => {
    if (field === 'relevance') {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff * dir;
    }

    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return (timeB - timeA) * dir;
  });
}

function computeFacets(documents: SearchDocument[]): SearchFacets {
  const byEntityType: Record<SearchEntityType, number> = {
    transaction: 0,
    vault: 0,
    proposal: 0,
    reward: 0,
    activity: 0,
  };

  for (const doc of documents) {
    byEntityType[doc.entityType] += 1;
  }

  return { byEntityType };
}

let sharedService: SearchService | null = null;

export function getSearchService(): SearchService {
  if (!sharedService) {
    sharedService = new SearchService();
  }
  return sharedService;
}

/** Run a quick benchmark over the search service. */
export function benchmarkSearch(
  service: SearchService,
  query: SearchQuery,
  iterations = 50,
): { avgMs: number; minMs: number; maxMs: number; iterations: number } {
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const result = service.search(query);
    durations.push(result.queryMs);
  }

  durations.sort((a, b) => a - b);

  return {
    avgMs: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    minMs: durations[0] ?? 0,
    maxMs: durations[durations.length - 1] ?? 0,
    iterations,
  };
}
