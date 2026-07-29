import React from "react";
import { LineChart } from "@/charts/LineChart";
import { AnalyticsCard } from "./AnalyticsCard";
import { type APYHistory } from "@/hooks/useAnalytics";
import { Percent, TrendingUp, Activity, Minus } from "lucide-react";

interface APYHistoryPanelProps {
  data: APYHistory;
  className?: string;
}

export function APYHistoryPanel({ data, className = "" }: APYHistoryPanelProps) {
  const chartData = data.history.map((h) => ({
    label: h.date.slice(5),
    value: h.apy,
  }));

  const volatilityLabel =
    data.volatility < 1
      ? "Very Stable"
      : data.volatility < 3
      ? "Stable"
      : data.volatility < 5
      ? "Moderate"
      : "Volatile";

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Current APY"
          value={`${data.currentAPY.toFixed(2)}%`}
          subtitle="Annual yield rate"
          icon={<Percent className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="Average APY"
          value={`${data.averageAPY.toFixed(2)}%`}
          subtitle="Historical average"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="APY Range"
          value={`${data.minAPY.toFixed(2)}% - ${data.maxAPY.toFixed(2)}%`}
          subtitle="Min / Max observed"
          icon={<Activity className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="Volatility"
          value={volatilityLabel}
          subtitle={`σ = ${data.volatility.toFixed(2)}%`}
          icon={<Minus className="w-5 h-5" />}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">APY History</h3>
        {chartData.length > 0 ? (
          <LineChart
            data={chartData}
            color="#8b5cf6"
            gradientFrom="#8b5cf6"
            gradientTo="#8b5cf6"
            isArea={true}
            height={300}
            showAverage={true}
            yAxisFormatter={(v) => `${v.toFixed(1)}%`}
            tooltipFormatter={(v) => `${v.toFixed(2)}%`}
            referenceValue={data.currentAPY}
            referenceLabel="Current"
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            No APY history available yet
          </div>
        )}
      </div>
    </div>
  );
}