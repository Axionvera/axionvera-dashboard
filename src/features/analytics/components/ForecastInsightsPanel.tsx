import React, { useMemo, useState } from "react";
import { ForecastChart } from "@/charts";
import type { AnalyticsForecasts, MetricForecast } from "@/types/analytics";
import { formatCurrency } from "@/services/analytics/calculations";

interface ForecastInsightsPanelProps {
  forecasts: AnalyticsForecasts;
}

type ForecastMetricKey = keyof AnalyticsForecasts;

const METRIC_OPTIONS: Array<{ key: ForecastMetricKey; label: string }> = [
  { key: "performance", label: "Balance" },
  { key: "rewards", label: "Rewards" },
  { key: "apy", label: "APY" },
  { key: "flow", label: "Net Flow" },
];

function getMetricTitle(metric: MetricForecast["metric"]): string {
  if (metric === "balance") return "Balance Forecast";
  if (metric === "rewards") return "Rewards Forecast";
  if (metric === "apy") return "APY Forecast";
  return "Net Flow Forecast";
}

function formatValue(metric: MetricForecast["metric"], value: number): string {
  if (metric === "apy") return `${value.toFixed(2)}%`;
  return `${formatCurrency(value, 2)} XLM`;
}

function formatYAxis(metric: MetricForecast["metric"], value: number): string {
  if (metric === "apy") return `${value.toFixed(1)}%`;
  return formatCurrency(value, 0);
}

export function ForecastInsightsPanel({ forecasts }: ForecastInsightsPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<ForecastMetricKey>("performance");

  const activeForecast = useMemo(() => forecasts[selectedMetric], [forecasts, selectedMetric]);

  const currentHistoricalValue =
    activeForecast.historical.length > 0
      ? activeForecast.historical[activeForecast.historical.length - 1].value
      : null;
  const finalForecastValue =
    activeForecast.forecast.length > 0
      ? activeForecast.forecast[activeForecast.forecast.length - 1].predicted
      : null;

  const changePercent =
    currentHistoricalValue !== null &&
    finalForecastValue !== null &&
    currentHistoricalValue !== 0
      ? ((finalForecastValue - currentHistoricalValue) / currentHistoricalValue) * 100
      : null;

  return (
    <section className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Predictive Insights</h3>
          <p className="text-sm text-slate-400 mt-1">
            Forecasts are generated from historical protocol metrics with deterministic trend models.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {METRIC_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedMetric(option.key)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                selectedMetric === option.key
                  ? "border-sky-500 bg-sky-500/20 text-sky-200"
                  : "border-slate-600 bg-slate-800/80 text-slate-300 hover:border-slate-500"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ForecastChart
        forecast={activeForecast}
        title={getMetricTitle(activeForecast.metric)}
        yAxisFormatter={(value) => formatYAxis(activeForecast.metric, value)}
        tooltipFormatter={(value) => formatValue(activeForecast.metric, value)}
      />

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-400 mb-1">Current Baseline</p>
          <p className="text-lg font-semibold text-slate-100">
            {currentHistoricalValue === null
              ? "N/A"
              : formatValue(activeForecast.metric, currentHistoricalValue)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-400 mb-1">Forecast Horizon</p>
          <p className="text-lg font-semibold text-slate-100">{activeForecast.horizon}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-400 mb-1">Projected Change</p>
          <p
            className={`text-lg font-semibold ${
              changePercent === null
                ? "text-slate-100"
                : changePercent >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
            }`}
          >
            {changePercent === null ? "N/A" : `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Assumptions</p>
        <ul className="space-y-2 text-sm text-slate-300">
          {activeForecast.metadata.assumptions.map((assumption) => (
            <li key={assumption} className="leading-relaxed">{assumption}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
