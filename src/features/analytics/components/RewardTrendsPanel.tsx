import React from "react";
import { LineChart } from "@/charts/LineChart";
import { BarChart } from "@/charts/BarChart";
import { AnalyticsCard } from "./AnalyticsCard";
import { type RewardTrend } from "@/hooks/useAnalytics";
import { formatAmount } from "@/utils/contractHelpers";
import { Calendar, Clock, TrendingUp, Award } from "lucide-react";

interface RewardTrendsPanelProps {
  data: RewardTrend;
  className?: string;
}

export function RewardTrendsPanel({ data, className = "" }: RewardTrendsPanelProps) {
  const dailyData = data.daily.map((d) => ({
    label: d.date.slice(5),
    value: d.value,
  }));

  const weeklyData = data.weekly.map((w) => ({
    label: w.date.slice(5),
    value: w.value,
  }));

  const trendColor =
    data.trendDirection === "up"
      ? "#10b981"
      : data.trendDirection === "down"
      ? "#f43f5e"
      : "#f59e0b";

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Rewards Earned"
          value={formatAmount(data.totalEarned.toString())}
          subtitle="Lifetime earnings"
          icon={<Award className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="Daily Average"
          value={formatAmount(data.averageDaily.toString())}
          subtitle="Per day with activity"
          icon={<Clock className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="7-Day Trend"
          value={data.trendDirection === "up" ? "Rising" : data.trendDirection === "down" ? "Falling" : "Stable"}
          trend={data.trendDirection}
          trendValue={`${data.trendPercent >= 0 ? "+" : ""}${data.trendPercent.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="Active Days"
          value={data.daily.length.toString()}
          subtitle="Days with rewards"
          icon={<Calendar className="w-5 h-5" />}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Daily Reward History</h3>
        {dailyData.length > 0 ? (
          <LineChart
            data={dailyData}
            color={trendColor}
            gradientFrom={trendColor}
            gradientTo={trendColor}
            isArea={true}
            height={280}
            yAxisFormatter={(v) => formatAmount(v.toString())}
            tooltipFormatter={(v) => formatAmount(v.toString())}
          />
        ) : (
          <div className="h-[280px] flex items-center justify-center text-slate-500">
            No reward data available yet
          </div>
        )}
      </div>

      {weeklyData.length > 1 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Reward Totals</h3>
          <BarChart
            data={weeklyData}
            color={trendColor}
            height={240}
            yAxisFormatter={(v) => formatAmount(v.toString())}
            tooltipFormatter={(v) => formatAmount(v.toString())}
          />
        </div>
      )}
    </div>
  );
}