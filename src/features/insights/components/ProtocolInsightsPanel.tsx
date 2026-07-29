import { AlertTriangle, BrainCircuit, CheckCircle2, Lightbulb, RefreshCw } from "lucide-react";
import type { ProtocolInsights, InsightCard } from "@/insights/types";

const severityClass = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  info: "border-indigo-500/30 bg-indigo-500/10 text-indigo-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  critical: "border-red-500/30 bg-red-500/10 text-red-200",
};

function RecommendationCard({ card }: { card: InsightCard }) {
  return (
    <div className={`rounded-xl border p-4 ${severityClass[card.severity]}`}>
      <div className="flex items-start gap-3">
        <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-white">{card.title}</h4>
          <p className="mt-1 text-sm text-slate-300">{card.description}</p>
          {card.action ? <p className="mt-3 text-xs font-medium uppercase tracking-wide">{card.action}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function ProtocolInsightsPanel({
  insights,
  isRefreshing,
  onRefresh,
}: {
  insights: ProtocolInsights;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-300">
            <BrainCircuit className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">AI-powered protocol insights</span>
          </div>
          <h3 className="mt-2 text-2xl font-bold text-white">Contextual recommendations</h3>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">{insights.summary}</p>
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh insights
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {insights.cards.map((card) => (
          <div key={card.id} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
            <p className="text-sm text-slate-400">{card.metricLabel}</p>
            <p className="mt-1 text-2xl font-bold text-white">{card.metricValue}</p>
            <h4 className="mt-3 font-semibold text-white">{card.title}</h4>
            <p className="mt-1 text-sm text-slate-300">{card.description}</p>
          </div>
        ))}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
          <p className="text-sm text-slate-400">Active anomalies</p>
          <p className="mt-1 text-2xl font-bold text-white">{insights.anomalies.length}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            {insights.anomalies.length ? <AlertTriangle className="h-4 w-4 text-amber-300" /> : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
            {insights.anomalies.length ? "Review flagged metric changes" : "No significant metric deviations"}
          </div>
        </div>
      </div>

      {insights.anomalies.length ? (
        <div className="mt-5 space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Anomaly detection</h4>
          {insights.anomalies.map((anomaly) => (
            <div key={anomaly.id} className={`rounded-xl border p-4 ${severityClass[anomaly.severity]}`}>
              <h5 className="font-semibold text-white">{anomaly.title}</h5>
              <p className="mt-1 text-sm text-slate-300">{anomaly.description}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {insights.recommendations.map((card) => (
          <RecommendationCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
