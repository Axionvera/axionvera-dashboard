import React from "react";
import { cn } from "@/lib/utils";
import { buildRuntimeRecoveryState, updateRecoveryLifecycle, type RuntimeRecoveryState } from "@/errors";

interface Props {
  children: React.ReactNode;
  sectionName?: string;
  className?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  recovery?: RuntimeRecoveryState;
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const recovery = buildRuntimeRecoveryState(
      error,
      info,
      this.props.sectionName || "SectionErrorBoundary",
      3
    );

    if (process.env.NODE_ENV === "development") {
      console.error("[SectionErrorBoundary]", error, info.componentStack);
    }

    this.setState({ error, recovery });
  }

  handleRetry = () => {
    if (this.state.recovery) {
      updateRecoveryLifecycle(this.state.recovery.diagnostic, "retry");
    }
    this.setState({ hasError: false, error: undefined, recovery: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { sectionName = "This section", className } = this.props;

    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 text-center shadow-sm",
          className
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">
            {sectionName} could not be loaded
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            An error occurred while loading this part of the page.
          </p>
        </div>
        <button
          onClick={this.handleRetry}
          className="mt-2 rounded-md bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
}
