import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';

import { useGovernance } from '@/hooks/useGovernance';
import { useVault } from '@/hooks/useVault';
import { Badge } from '@/design-system';
import { useSearch } from '@/hooks/useSearch';
import { SEARCH_ENTITY_LABELS, type SearchDocument, type SearchEntityType } from '@/search';

const ENTITY_TYPES: SearchEntityType[] = [
  'transaction',
  'vault',
  'proposal',
  'reward',
  'activity',
];

function SearchResultItem({ doc, onSelect }: { doc: SearchDocument; onSelect: () => void }) {
  return (
    <Link
      href={doc.route}
      onClick={onSelect}
      className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-100 dark:hover:bg-slate-900/60"
    >
      <Badge variant="default" className="mt-0.5 shrink-0 text-[10px] uppercase tracking-wide">
        {SEARCH_ENTITY_LABELS[doc.entityType]}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{doc.title}</p>
        {doc.subtitle && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{doc.subtitle}</p>
        )}
      </div>
      {doc.timestamp && (
        <time
          dateTime={doc.timestamp}
          className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500"
        >
          {new Date(doc.timestamp).toLocaleDateString()}
        </time>
      )}
    </Link>
  );
}

/**
 * Global search overlay with advanced filtering.
 * Mounted in the navbar and searches across vault, governance, and protocol data.
 */
export function GlobalSearch() {
  const { transactions, balance, rewards } = useVault();
  const { proposals } = useGovernance();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    filters,
    isOpen,
    result,
    setQuery,
    updateFilters,
    clearFilters,
    setOpen,
  } = useSearch({
    transactions,
    vaultBalances: { balance, rewards },
    proposals,
  });

  const toggleEntityType = useCallback(
    (type: SearchEntityType) => {
      const current = filters.entityTypes ?? [];
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      updateFilters({ entityTypes: next.length > 0 ? next : undefined });
    },
    [filters.entityTypes, updateFilters],
  );

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setOpen, handleClose]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClose]);

  const hasActiveFilters = Boolean(
    filters.entityTypes?.length ||
    filters.status?.length ||
    filters.startDate ||
    filters.endDate,
  );

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        aria-label="Open global search"
        aria-expanded={isOpen}
        aria-controls="global-search-panel"
        className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 transition hover:bg-slate-200/50 dark:hover:bg-slate-900/60"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden md:inline">Search…</span>
        <kbd className="hidden lg:inline rounded border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>

      {isOpen && (
        <div
          id="global-search-panel"
          role="dialog"
          aria-label="Global search"
          className="absolute right-0 mt-2 w-[min(100vw-2rem,28rem)] origin-top-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-50 overflow-hidden"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 p-3">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions, proposals, rewards…"
              aria-label="Search query"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-axion-500/50"
            />
          </div>

          <div className="border-b border-slate-100 dark:border-slate-800 px-3 py-2">
            <div className="flex flex-wrap gap-1.5">
              {ENTITY_TYPES.map((type) => {
                const active = filters.entityTypes?.includes(type);
                const count = result.facets.byEntityType[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleEntityType(type)}
                    aria-pressed={active}
                    className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                      active
                        ? 'bg-axion-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {SEARCH_ENTITY_LABELS[type]}
                    {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                  </button>
                );
              })}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Search results">
            {result.documents.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {query.trim() || hasActiveFilters
                  ? 'No results match your search.'
                  : 'Type to search across the dashboard.'}
              </p>
            ) : (
              result.documents.map((doc) => (
                <SearchResultItem key={doc.id} doc={doc} onSelect={handleClose} />
              ))
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>{result.total} result{result.total !== 1 ? 's' : ''}</span>
            <span>{result.queryMs.toFixed(1)}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
