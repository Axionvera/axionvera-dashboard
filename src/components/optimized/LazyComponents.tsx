/**
 * @module components/optimized/LazyComponents
 *
 * Lazy-loaded component wrappers for code splitting.
 * Improves initial bundle size and load time.
 */

import dynamic, { type DynamicOptionsLoadingProps } from "next/dynamic";
import React from "react";

/**
 * Loading component for lazy-loaded components.
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  );
}

/**
 * Lazy-loaded Analytics Dashboard.
 * Only loaded when needed, reducing initial bundle size.
 */
export const LazyAnalyticsDashboard = dynamic(
  () => import("@/features/analytics").then((mod) => ({ default: mod.AnalyticsDashboard })),
  {
    loading: () => <LoadingFallback />,
    ssr: false, // Analytics dashboard doesn't need SSR
  }
);

/**
 * Lazy-loaded Transaction History.
 * Heavy component that can be loaded on-demand.
 */
export const LazyTransactionHistory = dynamic(
  () => import("@/features/transactions").then((mod) => ({ default: mod.TransactionHistory })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Governance components.
 */
export const LazyGovernanceStats = dynamic(
  () => import("@/features/governance").then((mod) => ({ default: mod.GovernanceStatsPanel })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

export const LazyProposalList = dynamic(
  () => import("@/features/governance").then((mod) => ({ default: mod.ProposalList })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Chart components.
 * Charts are heavy and can be loaded when needed.
 */
export const LazyPerformanceChart = dynamic(
  () => import("@/components/visualizations").then((mod) => ({ default: mod.PerformanceChart })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

export const LazyFlowChart = dynamic(
  () => import("@/components/visualizations").then((mod) => ({ default: mod.FlowChart })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

export const LazyAPYChart = dynamic(
  () => import("@/components/visualizations").then((mod) => ({ default: mod.APYChart })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

export const LazyNetworkDiagram = dynamic(
  () => import("@/charts").then((mod) => ({ default: mod.NetworkDiagram })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

export const LazyStatisticsBar = dynamic(
  () => import("@/charts").then((mod) => ({ default: mod.StatisticsBar })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Modal components.
 * Modals are only loaded when opened.
 */
export const LazyCreateProposalModal = dynamic(
  () => import("@/features/governance").then((mod) => ({ default: mod.CreateProposalModal })),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

/**
 * HOC to make any component lazy-loaded.
 */
export function makeLazy<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: (loadingProps: DynamicOptionsLoadingProps) => JSX.Element | null;
    ssr?: boolean;
  }
): React.ComponentType<React.ComponentProps<T>> {
  return dynamic(importFn, {
    loading: options?.loading || LoadingFallback,
    ssr: options?.ssr ?? false,
  });
}
