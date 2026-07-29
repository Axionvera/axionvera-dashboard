/**
 * Fallback state components for graceful degradation
 */

'use client';

import React from 'react';

/**
 * Props for fallback placeholder components
 */
export interface FallbackPlaceholderProps {
  type: 'card' | 'chart' | 'list' | 'table' | 'text' | 'balance' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Fallback balance card component
 */
export function FallbackBalanceCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 animate-pulse" />
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-40 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-32 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Fallback chart component
 */
export function FallbackChart({ className = '', height = 'h-64' }: { className?: string; height?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${height} ${className}`}>
      <div className="h-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Chart data unavailable</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback list component
 */
export function FallbackList({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-12 animate-pulse" />
      ))}
    </div>
  );
}

/**
 * Fallback table component
 */
export function FallbackTable({ rows = 5, columns = 4, className = '' }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 flex gap-4 border-b border-gray-200 dark:border-gray-800">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowI) => (
        <div key={rowI} className="px-6 py-4 flex gap-4 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
          {Array.from({ length: columns }).map((_, colI) => (
            <div key={colI} className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Fallback text/paragraph component
 */
export function FallbackText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: i === lines - 1 ? '80%' : '100%' }}
        />
      ))}
    </div>
  );
}

/**
 * Generic fallback placeholder
 */
export function FallbackPlaceholder({
  type = 'card',
  size = 'md',
  className = ''
}: FallbackPlaceholderProps) {
  switch (type) {
    case 'card':
      return <FallbackBalanceCard className={className} />;
    case 'chart':
      return <FallbackChart className={className} />;
    case 'list':
      return <FallbackList className={className} />;
    case 'table':
      return <FallbackTable className={className} />;
    case 'text':
      return <FallbackText className={className} />;
    case 'button':
      return (
        <div className={`h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse ${className}`} />
      );
    default:
      return <FallbackText className={className} />;
  }
}

/**
 * Data unavailable state component
 */
export interface DataUnavailableProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function DataUnavailable({
  title = 'Data Unavailable',
  message = 'Unable to load the requested data. Please try again.',
  icon,
  action,
  className = ''
}: DataUnavailableProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {icon ? (
        <div className="mb-4">{icon}</div>
      ) : (
        <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 max-w-sm">
        {message}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Retry fallback component
 */
export interface RetryFallbackProps {
  error?: string;
  onRetry: () => void | Promise<void>;
  isRetrying?: boolean;
  className?: string;
}

export function RetryFallback({
  error = 'Something went wrong. Please try again.',
  onRetry,
  isRetrying = false,
  className = ''
}: RetryFallbackProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900/50 ${className}`}>
      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
        <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
        Unable to Load
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 max-w-sm">
        {error}
      </p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        {isRetrying ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Retrying...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </>
        )}
      </button>
    </div>
  );
}
