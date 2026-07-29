import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  buildRuntimeRecoveryState,
  updateRecoveryLifecycle,
  type RuntimeRecoveryState,
} from '@/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((args: ErrorBoundaryFallbackProps) => ReactNode);
  name?: string;
  maxRetries?: number;
  onRecovered?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  recovery?: RuntimeRecoveryState;
  boundaryKey: number;
}

export interface ErrorBoundaryFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  recovery?: RuntimeRecoveryState;
  retry: () => void;
  reset: () => void;
  dismiss: () => void;
  goBack: () => void;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, boundaryKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const recovery = buildRuntimeRecoveryState(
      error,
      errorInfo,
      this.props.name,
      this.props.maxRetries ?? 3
    );

    console.error('ErrorBoundary caught a recoverable runtime error:', recovery.diagnostic);

    this.setState({ error, errorInfo, recovery });
  }

  private recover = (event: 'retry' | 'reset' | 'dismiss') => {
    if (this.state.recovery) {
      updateRecoveryLifecycle(this.state.recovery.diagnostic, event);
    }

    this.setState(prev => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      recovery: prev.recovery
        ? {
            ...prev.recovery,
            retryCount: event === 'retry' ? prev.recovery.retryCount + 1 : prev.recovery.retryCount,
            canRetry: event === 'retry'
              ? prev.recovery.retryCount + 1 < prev.recovery.maxRetries
              : prev.recovery.canRetry,
          }
        : undefined,
      boundaryKey: prev.boundaryKey + 1,
    }));

    this.props.onRecovered?.();
  };

  handleRetry = () => this.recover('retry');
  handleReset = () => this.recover('reset');
  handleDismiss = () => this.recover('dismiss');

  handleGoBack = () => {
    if (this.state.recovery) {
      updateRecoveryLifecycle(this.state.recovery.diagnostic, 'navigate-back');
    }
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      const fallbackProps: ErrorBoundaryFallbackProps = {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        recovery: this.state.recovery,
        retry: this.handleRetry,
        reset: this.handleReset,
        dismiss: this.handleDismiss,
        goBack: this.handleGoBack,
      };

      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(fallbackProps);
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      const retryDisabled = !this.state.recovery?.canRetry;

      return (
        <div role="alert" className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center transition-all">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4 transition-colors text-3xl">
              ⚠️
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">
              We isolated a dashboard error
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your session is still active. Choose a recovery action to restore this area without refreshing the page.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Diagnostic ID: <code>{this.state.recovery?.diagnostic.id ?? 'pending'}</code>
            </p>

            <div className="space-y-3">
              <button onClick={this.handleRetry} disabled={retryDisabled} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Retry failed section
              </button>
              <button onClick={this.handleReset} className="w-full bg-slate-900 dark:bg-slate-100 hover:opacity-90 text-white dark:text-slate-900 font-medium py-3 px-4 rounded-lg transition-colors">
                Reset section state
              </button>
              <button onClick={this.handleGoBack} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-xl transition-all">
                Go Back
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Recovery details
                </summary>
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-red-600 dark:text-red-400 overflow-auto max-h-48 transition-colors">
                  <div className="font-bold mb-2">Error:</div>
                  {this.state.error?.toString()}
                  <div className="font-bold mt-3 mb-2">Lifecycle:</div>
                  {this.state.recovery?.diagnostic.lifecycle.join(' → ')}
                  {this.state.errorInfo && <pre className="mt-3 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.boundaryKey}>{this.props.children}</React.Fragment>;
  }
}
