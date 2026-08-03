/**
 * @module features/analytics
 *
 * Public API for the analytics feature.
 *
 * Two dashboards coexist on purpose, with different data strategies:
 * - `AnalyticsDashboard` reads the connected wallet through hooks (`useVault`,
 *   `useAnalytics`) and takes no props. This is the one wired into the widget registry.
 * - `AnalyticsReportPanel` takes an `address` and fetches a period report through
 *   the analytics service layer.
 */

export { AnalyticsDashboard } from "./components/AnalyticsDashboard";
export {
  AnalyticsReportPanel,
  type AnalyticsReportPanelProps,
} from "./components/AnalyticsReportPanel";
export { AnalyticsCard } from "./components/AnalyticsCard";
export { RewardTrendsPanel } from "./components/RewardTrendsPanel";
export { APYHistoryPanel } from "./components/APYHistoryPanel";
export { FlowPanel } from "./components/FlowPanel";
export { ParticipationPanel } from "./components/ParticipationPanel";
export { ForecastInsightsPanel } from "./components/ForecastInsightsPanel";
export { default as AnalyticsMetrics } from "./components/AnalyticsMetrics";
export { default as BalanceTrendChart } from "./components/BalanceTrendChart";
