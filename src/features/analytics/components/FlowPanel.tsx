import React, { useMemo } from "react";
import { ComposedChart } from "@/charts/ComposedChart";
import { BarChart } from "@/charts/BarChart";
import { PieChart } from "@/charts/PieChart";
import { LineChart } from "@/charts/LineChart";
import { AnalyticsCard } from "./AnalyticsCard";
import { type DepositWithdrawMetrics } from "@/hooks/useAnalytics";
import { formatAmount } from "@/utils/contractHelpers";
import { ArrowDownLeft, ArrowUpRight, Scale, Wallet } from "lucide-react";

interface FlowPanelProps {
  data: DepositWithdrawMetrics;
  className?: string;
}

export function FlowPanel({ data, className = "" }: FlowPanelProps) {
  const netFlowColor = data.netFlow >= 0 ? "#10b981" : "#f43f5e";

  const flowHistoryData = useMemo(
    () =>
      data.flowHistory.map((f) => ({
        label: f.date.slice(5),
        value: f.value,
      })),
    [data.flowHistory]
  );

  const depositWithdrawData = useMemo(() => {
    const allDates = new Set<string>();
    data.deposits.history.forEach((d) => allDates.add(d.date.slice(5)));
    data.withdrawals.history.forEach((w) => allDates.add(w.date.slice(5)));

    return Array.from(allDates)
      .sort()
      .map((date) => ({
        label: date,
        deposits:
          data.deposits.history
            .filter((d) => d.date.slice(5) === date)
            .reduce((sum, d) => sum + d.value, 0) || 0,
        withdrawals:
          data.withdrawals.history
            .filter((w) => w.date.slice(5) === date)
            .reduce((sum, w) => sum + w.value, 0) || 0,
      }));
  }, [data.deposits.history, data.withdrawals.history]);

  const pieData = [
    { name: "Deposits", value: data.deposits.total, color: "#10b981" },
    { name: "Withdrawals", value: data.withdrawals.total, color: "#f43f5e" },
    { name: "Net Position", value: Math.abs(data.netFlow), color: netFlowColor },
  ].filter((d) => d.value > 0);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Deposited"
          value={formatAmount(data.deposits.total.toString())}
          subtitle={`${data.deposits.count} transactions`}
          trend="up"
          trendValue={`Avg ${formatAmount(data.deposits.average.toString())}`}
          icon={<ArrowDownLeft className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="Total Withdrawn"
          value={formatAmount(data.withdrawals.total.toString())}
          subtitle={`${data.withdrawals.count} transactions`}
          trend="down"
          trendValue={`Avg ${formatAmount(data.withdrawals.average.toString())}`}
          icon={<ArrowUpRight className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="Net Flow"
          value={formatAmount(Math.abs(data.netFlow).toString())}
          subtitle={data.netFlow >= 0 ? "Net inflow" : "Net outflow"}
          trend={data.netFlow >= 0 ? "up" : "down"}
          trendValue={data.netFlow >= 0 ? "Growing" : "Declining"}
          icon={<Scale className="w-5 h-5" />}
        />
        <AnalyticsCard
          title="Largest Deposit"
          value={formatAmount(data.deposits.largest.toString())}
          subtitle="Single transaction"
          icon={<Wallet className="w-5 h-5" />}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Deposits vs Withdrawals</h3>
        {depositWithdrawData.length > 0 ? (
          <ComposedChart
            data={depositWithdrawData}
            series={[
              { key: "deposits", type: "bar", color: "#10b981", name: "Deposits" },
              { key: "withdrawals", type: "bar", color: "#f43f5e", name: "Withdrawals" },
            ]}
            height={280}
            yAxisFormatterLeft={(v) => formatAmount(v.toString())}
            tooltipFormatter={(v, name) => [formatAmount(v.toString()), name]}
          />
        ) : (
          <div className="h-[280px] flex items-center justify-center text-slate-500">
            No flow data available yet
          </div>
        )}
      </div>

      {flowHistoryData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Cumulative Net Position</h3>
          <LineChart
            data={flowHistoryData}
            color={netFlowColor}
            gradientFrom={netFlowColor}
            gradientTo={netFlowColor}
            isArea={true}
            height={260}
            yAxisFormatter={(v) => formatAmount(v.toString())}
            tooltipFormatter={(v) => formatAmount(v.toString())}
          />
        </div>
      )}

      {pieData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Flow Distribution</h3>
          <div className="max-w-md mx-auto">
            <PieChart
              data={pieData}
              height={260}
              tooltipFormatter={(v, name) => [formatAmount(v.toString()), name]}
            />
          </div>
        </div>
      )}
    </div>
  );
}