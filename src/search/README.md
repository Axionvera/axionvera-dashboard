# Search API

Client-side global search for the Axionvera dashboard. Searches transactions, vault balances, governance proposals, rewards, and protocol activity without a backend service.

## Architecture

```
Data Sources                    Index Layer                  Query Layer
─────────────                   ───────────                  ───────────
Vault SDK (transactions)  ──►  normalize.ts           ──►  SearchService
Governance SDK (proposals) ──►  indexBuilder.ts              ├── structured filters
EventIndexer (activity)    ──►  SearchIndex                  ├── fuzzy text match
ActivityStore (live feed)  ──►                               └── pagination + facets
                                      ▲
SearchStore (sessionStorage) ◄── useSearch hook ◄── GlobalSearch UI
```

## Modules

| Module | Path | Purpose |
|--------|------|---------|
| Types | `src/search/types.ts` | `SearchDocument`, `SearchQuery`, `SearchFilters`, `SearchResult` |
| Normalize | `src/search/normalize.ts` | Map domain entities to unified `SearchDocument` |
| Index | `src/search/indexBuilder.ts` | Build and hold the in-memory document index |
| Fuzzy | `src/search/fuzzy.ts` | Token-based fuzzy matching with Levenshtein scoring |
| Service | `src/search/searchService.ts` | Execute queries with filter combination and pagination |
| Persistence | `src/search/persistence.ts` | Session-scoped state via `sessionStorage` |
| Store | `src/store/searchStore.ts` | Observable store for query, filters, and panel state |
| Hook | `src/hooks/useSearch.ts` | React integration with live data sources |
| UI | `src/features/search/GlobalSearch.tsx` | Navbar search overlay (⌘K) |

## Indexing Strategy

1. **Transactions** — Each `VaultTx` becomes a `transaction` document. `claim` type txs also produce a `reward` document.
2. **Vault** — Current balance/rewards snapshot produces one navigational `vault` document.
3. **Proposals** — Each governance `Proposal` is indexed with title, description, proposer, and status.
4. **Activity** — Events from `activityStore` and `EventIndexer` are merged and deduplicated by id.
5. **Deduplication** — Stable composite ids (`tx:`, `proposal:`, `activity:`, etc.) prevent duplicates on rebuild.

The index rebuilds on data changes via `useMemo` in `useSearch`. No external indexing platform is required.

## Search API

### `SearchService.search(query)`

```typescript
import { getSearchService } from '@/search';
import { getSearchIndex } from '@/search';

const index = getSearchIndex();
index.rebuild({ transactions, proposals, activityEvents });

const service = getSearchService();
service.setIndex(index);

const result = service.search({
  text: 'quorum',
  filters: {
    entityTypes: ['proposal'],
    status: ['active'],
    startDate: '2025-01-01',
    endDate: '2025-12-31',
  },
  pagination: { page: 1, pageSize: 20 },
  fuzzy: true,
  sort: { field: 'relevance', direction: 'desc' },
});

// result.documents — matching SearchDocument[]
// result.total       — total match count (pre-pagination)
// result.facets      — counts by entity type
// result.queryMs     — query duration in milliseconds
```

### `useSearch` hook

```typescript
import { useSearch } from '@/hooks/useSearch';

const { query, filters, result, setQuery, updateFilters } = useSearch({
  transactions,
  vaultBalances: { balance, rewards },
  proposals,
});
```

### Filter combination

All filters use **AND** semantics:

- `entityTypes` — restrict to selected categories
- `status` — match document status field
- `startDate` / `endDate` — timestamp range (inclusive)
- `contractIds` — filter activity events by contract

Text search is applied after structured filters. Fuzzy matching is enabled by default.

## Performance

- In-memory index with O(n) filter passes; suitable for dashboard-scale data (<10k documents).
- `SearchService` reports `queryMs` per query.
- `benchmarkSearch(service, query, iterations)` utility for micro-benchmarks.
- Typical queries complete in <5ms for indexes under 500 documents.

## State Persistence

Search query and filters persist in `sessionStorage` under `axionvera:search:state`. State survives client-side navigation within the same browser tab. Panel open/close state is ephemeral.

## Tests

```
tests/search/
├── normalize.test.ts      — entity normalization
├── fuzzy.test.ts          — fuzzy matching
├── searchService.test.ts  — query, filters, pagination, benchmarks
└── searchStore.test.ts    — persistence and store behavior
```

Run: `npm test -- tests/search`
