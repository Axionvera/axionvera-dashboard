import HealthLatencyBars from "@/charts/HealthLatencyBars";
import { useProtocolHealth } from "@/hooks/useProtocolHealth";
import type { ProtocolHealthStatus } from "@/services/protocolHealth";

const STATUS_COPY: Record<ProtocolHealthStatus, { label: string; className: string; dot: string }> = {
  operational: {
    label: "Operational",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  degraded: {
    label: "Degraded",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  down: {
    label: "Down",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
    dot: "bg-red-500",
  },
};

function formatCheckedAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export default function ProtocolHealthDashboard() {
  const { snapshot, isLoading, error, refresh } = useProtocolHealth();
  const status = snapshot?.status ?? "degraded";
  const statusCopy = STATUS_COPY[status];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Protocol Monitoring</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
            Live protocol health metrics for the dashboard&apos;s Stellar, Soroban, contract, and transaction dependencies.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center justify-center rounded-xl bg-axion-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-axion-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh Status"}
        </button>
      </div>

      <section className={`rounded-2xl border p-6 ${statusCopy.className}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <span className={`h-2.5 w-2.5 rounded-full ${statusCopy.dot}`} />
              {statusCopy.label}
            </div>
            <p className="mt-2 text-lg font-semibold">{snapshot?.summary ?? "Loading protocol health metrics."}</p>
          </div>
          {snapshot ? (
            <div className="text-sm">
              Last checked <span className="font-semibold">{formatCheckedAt(snapshot.checkedAt)}</span>
            </div>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2 md:grid-cols-2">
          {(snapshot?.metrics ?? []).map((metric) => {
            const metricStatus = STATUS_COPY[metric.status];
            return (
              <article
                key={metric.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">{metric.label}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{metric.description}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${metricStatus.className}`}>
                    {metricStatus.label}
                  </span>
                </div>
                <div className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">{metric.value}</div>
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {metric.latencyMs ? `${metric.latencyMs} ms latency` : `Checked ${formatCheckedAt(metric.checkedAt)}`}
                </div>
              </article>
            );
          })}

          {isLoading && !snapshot ? (
            <>
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
              ))}
            </>
          ) : null}
        </div>

        <div className="space-y-6">
          {snapshot ? <HealthLatencyBars data={snapshot.latencyTrend} /> : null}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Polling</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Health status refreshes automatically every {Math.round((snapshot?.nextCheckInMs ?? 30000) / 1000)} seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
