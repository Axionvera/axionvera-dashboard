import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { mockChartData } from "@/lib/mockChartData";

const AnalyticsChart = () => {
  const data = useMemo(() => mockChartData, []);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Custom tooltip to match dashboard theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return (
        <div className="rounded-xl border border-border-primary bg-background-primary p-4 shadow-xl shadow-black/10 backdrop-blur-md">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
            {formattedDate}
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-8">
              <span className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                APR
              </span>
              <span className="text-sm font-bold text-text-primary">
                {payload[0].value}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                TVL
              </span>
              <span className="text-sm font-bold text-text-primary">
                {formatCurrency(payload[1].value)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="h-full rounded-2xl border border-border-primary bg-background-primary/30 p-6 transition-all hover:border-border-focus/50">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-text-primary">
            Vault Performance
          </h3>
          <p className="text-xs font-medium text-text-muted uppercase tracking-widest mt-0.5">
            Historical APR & TVL
          </p>
        </div>
        
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-xs font-semibold text-text-secondary">APR %</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-semibold text-text-secondary">TVL</span>
          </div>
        </div>
      </div>

      <div className="h-[320px] w-full lg:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorApr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border-primary)"
              opacity={0.4}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 500 }}
              dy={10}
              minTickGap={40}
              tickFormatter={(str) => {
                const date = new Date(str);
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-text-muted)", fontSize: 11, fontWeight: 500 }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border-primary)', strokeWidth: 1 }} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="apr"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorApr)"
              animationDuration={1500}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="tvl"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorTvl)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default AnalyticsChart;
