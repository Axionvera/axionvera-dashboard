/**
 * @module features/analytics/components/AnalyticsReportPanel
 *
 * Address-driven analytics report: fetches a period report through the
 * analytics service layer and renders metrics, charts and forecasts.
 *
 * Not to be confused with `AnalyticsDashboard`, which renders the connected
 * wallet's analytics through the `useVault` / `useAnalytics` hooks.
 */

import React, { useState, useEffect } from "react";
import { PerformanceChart, FlowChart, APYChart } from "@/components/visualizations";
import { TimePeriod, type AnalyticsData } from "@/types/analytics";
import { fetchAnalyticsData } from "@/services/analytics";
import { ForecastInsightsPanel } from "./ForecastInsightsPanel";
import {
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
} from "@/services/analytics/calculations";

export interface AnalyticsReportPanelProps {
  /** Wallet address */
  address: string;
  /** Initial time period */
  initialPeriod?: TimePeriod;
}

export function AnalyticsReportPanel({
  address,
  initialPeriod = TimePeriod.MONTH,
}: AnalyticsReportPanelProps) {
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAnalyticsData(address, { period, metrics: [] });
        if (!cancelled) {
          setAnalyticsData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load analytics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [address, period]);

  // Period selector buttons
  const periods: { label: string; value: TimePeriod }[] = [
    { label: "24H", value: TimePeriod.DAY },
    { label: "7D", value: TimePeriod.WEEK },
    { label: "30D", value: TimePeriod.MONTH },
    { label: "90D", value: TimePeriod.QUARTER },
    { label: "1Y", value: TimePeriod.YEAR },
    { label: "All", value: TimePeriod.ALL },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-slate-800/50 rounded-2xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-96 bg-slate-800/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl border border-red-800 bg-red-900/30">
        <p className="text-red-300 text-center">{error}</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-8 rounded-2xl border border-slate-700 bg-slate-800/30">
        <p className="text-slate-400 text-center">No analytics data available</p>
      </div>
    );
  }

  const { performance, rewards, flow, apy, participation } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100">Analytics Dashboard</h2>
        <div className="flex gap-2">
          {periods.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === value
                  ? "bg-primary-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Return */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Total Return
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatPercentage(performance.totalReturnPercent)}
          </div>
          <div className="text-sm text-slate-400">
            {formatCurrency(performance.totalReturn)} XLM
          </div>
        </div>

        {/* APY */}
        <div className="bg-gradient-to-br from-purple-900/50 to-slate-900 border border-purple-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-sm text-purple-400 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Current APY
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {performance.apy.toFixed(2)}%
          </div>
          <div className="text-sm text-slate-400">
            Avg: {apy.average.toFixed(2)}%
          </div>
        </div>

        {/* Total Rewards */}
        <div className="bg-gradient-to-br from-emerald-900/50 to-slate-900 border border-emerald-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-sm text-emerald-400 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Total Rewards
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatLargeNumber(rewards.totalRewards)}
          </div>
          <div className="text-sm text-slate-400">
            Avg: {formatCurrency(rewards.averageReward)} XLM
          </div>
        </div>

        {/* Net Flow */}
        <div className="bg-gradient-to-br from-blue-900/50 to-slate-900 border border-blue-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-sm text-blue-400 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            Net Flow
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatLargeNumber(flow.netFlow)}
          </div>
          <div className="text-sm text-slate-400">
            Deposits - Withdrawals
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          Balance Performance
        </h3>
        <PerformanceChart
          balanceData={performance.balanceHistory}
          rewardData={rewards.rewardHistory}
          showRewards={true}
          showAverage={true}
          height={400}
          period={period}
          interactive={true}
        />
      </div>

      {/* Flow and APY Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flow Chart */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">
            Deposits & Withdrawals
          </h3>
          <FlowChart
            deposits={flow.depositHistory}
            withdrawals={flow.withdrawalHistory}
            height={350}
            showNetFlow={true}
          />
        </div>

        {/* APY Chart */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">APY Trends</h3>
          <APYChart
            data={apy.history}
            height={350}
            showAverage={true}
            showVolatility={true}
            currentAPY={apy.current}
          />
        </div>
      </div>

      <ForecastInsightsPanel forecasts={analyticsData.forecasts} />

      {/* Participation Metrics */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          Participation & Engagement
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-slate-400">Active Days</p>
            <p className="text-2xl font-bold text-white">{participation.activeDays}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Transactions</p>
            <p className="text-2xl font-bold text-white">
              {participation.transactionCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Avg Transaction</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(participation.avgTransactionSize, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Engagement Score</p>
            <p className="text-2xl font-bold text-emerald-400">
              {participation.engagementScore}/100
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
