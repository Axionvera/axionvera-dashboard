import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import type { HistoricalBalancePoint } from "@/utils/contractHelpers";
import { useTheme } from "@/contexts/ThemeContext";

type BalanceTrendChartProps = {
  data: HistoricalBalancePoint[];
};

export default function BalanceTrendChart({ data }: BalanceTrendChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chartData = data.map(point => ({
    date: new Date(point.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    balance: Number(point.balance),
    rewards: Number(point.rewards)
  }));

  return (
    <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Balance & Rewards Trend
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDark ? "#334155" : "#e2e8f0"}
            />
            <XAxis 
              dataKey="date" 
              stroke={isDark ? "#94a3b8" : "#64748b"}
            />
            <YAxis 
              stroke={isDark ? "#94a3b8" : "#64748b"}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                borderColor: isDark ? "#334155" : "#e2e8f0",
                borderRadius: "0.75rem"
              }}
              labelStyle={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#6366f1" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="Vault Balance"
            />
            <Line 
              type="monotone" 
              dataKey="rewards" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="Rewards"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
