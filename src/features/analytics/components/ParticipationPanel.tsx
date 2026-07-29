import React from "react";
import { BarChart } from "@/charts/BarChart";
import { AnalyticsCard } from "./AnalyticsCard";
import { type ProtocolParticipation } from "@/hooks/useAnalytics";
import { Users, Calendar, Zap, Star } from "lucide-react";

interface ParticipationPanelProps {
  data: ProtocolParticipation;
  className?: string;
}

export function ParticipationPanel({ data, className = "" }: ParticipationPanelProps) {
  const ratingColor = {
    excellent: "#10b981",
    good: "#3b82f6",
    moderate: "#f59e0b",
    low: "#f43f5e",
  };

  const weeklyData = data.weeklyActivity.map((w) => ({
    label: w.week.slice(5),
    value: w.volume,
  }));

  const monthlyData = data.monthlyActivity.map((m) => ({
    label: m.month.slice(0, 7),
    value: m.count,
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Transactions"
          value={data.totalTransactions.toString()}
          subtitle="All-time count"
          icon={<Users className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="Active Days"
          value={data.uniqueDaysActive.toString()}
          subtitle="Unique days with activity"
          icon={<Calendar className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="Activity Score"
          value={`${data.activityScore}/100`}
          subtitle={data.consistencyRating}
          trend={data.activityScore >= 60 ? "up" : data.activityScore >= 30 ? "flat" : "down"}
          trendValue={data.consistencyRating}
          icon={<Zap className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="Last Active"
          value={
            data.daysSinceLastInteraction === 0
              ? "Today"
              : `${data.daysSinceLastInteraction}d ago`
          }
          subtitle={data.lastInteraction ? data.lastInteraction.slice(0, 10) : "Never"}
          icon={<Star className="w-5 h-5" />}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Activity Score</h3>
          <span
            className="text-sm font-medium px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: `${ratingColor[data.consistencyRating]}20`,
              color: ratingColor[data.consistencyRating],
            }}
          >
            {data.consistencyRating}
          </span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${data.activityScore}%`,
              backgroundColor: ratingColor[data.consistencyRating],
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      </div>

      {weeklyData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Volume</h3>
          <BarChart data={weeklyData} color="#3b82f6" height={240} yAxisFormatter={(v) => v.toFixed(0)} />
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Transactions</h3>
          <BarChart data={monthlyData} color="#8b5cf6" height={240} yAxisFormatter={(v) => v.toFixed(0)} />
        </div>
      )}
    </div>
  );
}