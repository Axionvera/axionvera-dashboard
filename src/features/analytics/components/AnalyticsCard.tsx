import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  className = "",
  children,
}: AnalyticsCardProps) {
  const trendIcon = {
    up: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    down: <TrendingDown className="w-4 h-4 text-rose-400" />,
    flat: <Minus className="w-4 h-4 text-amber-400" />,
  };

  return (
    <div
      className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-sm text-slate-500">{subtitle}</div>}
      {trend && (
        <div className="flex items-center gap-1.5 mt-2">
          {trendIcon[trend]}
          <span
            className={`text-sm font-medium ${
              trend === "up"
                ? "text-emerald-400"
                : trend === "down"
                ? "text-rose-400"
                : "text-amber-400"
            }`}
          >
            {trendValue}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}