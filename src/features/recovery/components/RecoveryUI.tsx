/**
 * Recovery UI component for displaying errors with retry options
 */

'use client';

import React from 'react';
import { AppError, ErrorCategory } from '@/errors';
import { TransactionError } from '@/utils/transactionRecovery';

export interface RecoveryUIProps {
  error: AppError | TransactionError | null;
  isRecovering?: boolean;
  canRetry?: boolean;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * Get icon for error category
 */
function getErrorIcon(category: string): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return '🌐';
    case ErrorCategory.TIMEOUT:
      return '⏱️';
    case ErrorCategory.VALIDATION:
      return '⚠️';
    case ErrorCategory.SERVER:
      return '⚙️';
    case ErrorCategory.SERVICE_UNAVAILABLE:
      return '🔌';
    case ErrorCategory.CONTRACT:
    case ErrorCategory.BLOCKCHAIN:
      return '⛓️';
    default:
      return '❌';
  }
}

/**
 * Recovery UI Component
 */
export function RecoveryUI({
  error,
  isRecovering = false,
  canRetry = false,
  onRetry,
  onDismiss,
  showDetails = false,
  compact = false
}: RecoveryUIProps) {
  if (!error) return null;

  const isAppError = error instanceof AppError;
  const message = isAppError ? error.userFacingMessage : (error as TransactionError).userMessage;
  const icon = isAppError ? getErrorIcon(error.category) : '❌';
  const details = isAppError ? error.message : (error as TransactionError).message;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-800 dark:text-red-200 truncate">{message}</p>
        </div>
        {canRetry && (
          <button
            onClick={onRetry}
            disabled={isRecovering}
            className="flex-shrink-0 ml-2 px-3 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded transition-colors"
          >
            {isRecovering ? 'Retrying...' : 'Retry'}
          </button>
        )}
        {onDismiss && !canRetry && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-2 text-red-400 hover:text-red-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-xl shadow-sm p-6 transition-all">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-lg text-2xl">
            {icon}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {isAppError ? getErrorTitle(error.category) : 'Transaction Failed'}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {message}
          </p>

          {/* Suggested action */}
          {isAppError && error.category === ErrorCategory.VALIDATION && (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded">
              💡 Please check your input and try again.
            </p>
          )}

          {isAppError && error.category === ErrorCategory.TIMEOUT && (
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded">
              💡 The network is slow. Retrying with a longer timeout...
            </p>
          )}

          {!isAppError && (error as TransactionError).suggestedAction && (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded">
              💡 {(error as TransactionError).suggestedAction}
            </p>
          )}
        </div>

        {/* Close button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close error"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Details section */}
      {showDetails && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium">
            Show Details
          </summary>
          <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all whitespace-pre-wrap">
              {details}
            </p>
            {isAppError && error.code && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Error Code: <code className="font-mono">{error.code}</code>
              </p>
            )}
          </div>
        </details>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            disabled={isRecovering}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isRecovering ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Retrying...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry
              </>
            )}
          </button>
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Get user-friendly error title
 */
function getErrorTitle(category: string): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Connection Error';
    case ErrorCategory.TIMEOUT:
      return 'Request Timed Out';
    case ErrorCategory.VALIDATION:
      return 'Invalid Input';
    case ErrorCategory.SERVER:
      return 'Server Error';
    case ErrorCategory.SERVICE_UNAVAILABLE:
      return 'Service Unavailable';
    case ErrorCategory.CONTRACT:
    case ErrorCategory.BLOCKCHAIN:
      return 'Transaction Failed';
    default:
      return 'Error Occurred';
  }
}

/**
 * Error badge component for inline errors
 */
export interface ErrorBadgeProps {
  error: AppError | TransactionError | null;
  onDismiss?: () => void;
}

export function ErrorBadge({ error, onDismiss }: ErrorBadgeProps) {
  if (!error) return null;

  const isAppError = error instanceof AppError;
  const message = isAppError ? error.userFacingMessage : (error as TransactionError).userMessage;
  const icon = isAppError ? getErrorIcon(error.category) : '❌';

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
      <span className="text-sm">{icon}</span>
      <span className="text-sm font-medium text-red-800 dark:text-red-200">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-1 text-red-400 hover:text-red-600 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
