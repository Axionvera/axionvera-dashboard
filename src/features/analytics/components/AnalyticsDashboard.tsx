import React, { useState, memo } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useVault } from "@/hooks/useVault";
import { useWalletContext } from "@/hooks/useWallet";
import { RewardTrendsPanel } from "./RewardTrendsPanel";
import { APYHistoryPanel } from "./APYHistoryPanel";
import { FlowPanel } from "./FlowPanel";
import { ParticipationPanel } from "./ParticipationPanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { RenderBoundary } from "@/rendering";
import { ProtocolInsightsPanel } from "@/features/insights";
import { useProtocolInsights } from "@/hooks/useProtocolInsights";
import { RefreshCw, BarChart3, TrendingUp, PiggyBank, Users } from "lucide-react";

type TabKey = "rewards" | "apy" | "flows" | "participation";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "rewards", label: "Rewards", icon: <TrendingUp className="w-4 h-4" /> },
  { key: "apy", label: "APY History", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "flows", label: "Deposits & Withdrawals", icon: <PiggyBank className="w-4 h-4" /> },
  { key: "participation", label: "Protocol Activity", icon: <Users className="w-4 h-4" /> },
];

// Sub-components for better isolation
const AnalyticsHeader = memo(({
  lastUpdated,
  isLoading,
  onRefresh
}: {
  lastUpdated: number,
  isLoading: boolean,
  onRefresh: () => void
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h2 className="text-xl font-bold text-white">Portfolio Analytics</h2>
      <p className="text-sm text-slate-400">
        Last updated: {new Date(lastUpdated).toLocaleString()}
      </p>
    </div>
    <button
      onClick={() => void onRefresh()}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
      Refresh
    </button>
  </div>
));
AnalyticsHeader.displayName = "AnalyticsHeader";

const AnalyticsTabs = memo(({
  activeTab,
  onTabChange
}: {
  activeTab: TabKey,
  onTabChange: (tab: TabKey) => void
}) => (
  <div className="flex flex-wrap gap-2 border-b border-slate-700/50 pb-1">
    {TABS.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onTabChange(tab.key)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
          activeTab === tab.key
            ? "bg-slate-700/50 text-white border-b-2 border-indigo-500"
            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
        }`}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
));
AnalyticsTabs.displayName = "AnalyticsTabs";

export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("rewards");
  const wallet = useWalletContext();
  const vault = useVault();

  const { data: analytics, isLoading, error, refresh } = useAnalytics({
    transactions: vault.transactions,
    walletAddress: wallet.publicKey,
  });
  const insights = useProtocolInsights(analytics);

  if (!wallet.isConnected) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
        <p className="text-slate-400">Connect your wallet to view portfolio analytics</p>
      </div>
    );
  }

  if (isLoading && !analytics) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Portfolio Analytics</h2>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 border border-red-500/20 rounded-xl p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => void refresh()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
        <p className="text-slate-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RenderBoundary
        name="analytics-header"
        dependencies={[analytics.lastUpdated, isLoading]}
      >
        <AnalyticsHeader
          lastUpdated={analytics.lastUpdated}
          isLoading={isLoading}
          onRefresh={refresh}
        />
      </RenderBoundary>

      <RenderBoundary
        name="analytics-tabs"
        dependencies={[activeTab]}
      >
        <AnalyticsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </RenderBoundary>
      {insights ? (
        <ProtocolInsightsPanel
          insights={insights}
          isRefreshing={isLoading}
          onRefresh={() => void refresh()}
        />
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-slate-700/50 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-slate-700/50 text-white border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        <RenderBoundary
          name={`analytics-panel-${activeTab}`}
          dependencies={[activeTab, analytics]}
        >
          {activeTab === "rewards" && <RewardTrendsPanel data={analytics.rewards} />}
          {activeTab === "apy" && <APYHistoryPanel data={analytics.apy} />}
          {activeTab === "flows" && <FlowPanel data={analytics.flows} />}
          {activeTab === "participation" && <ParticipationPanel data={analytics.participation} />}
        </RenderBoundary>
      </div>
    </div>
  );
}
