import type { ConnectionStatus } from "@/services/events/types";

const STATUS_META: Record<
  ConnectionStatus,
  { label: string; dot: string; className: string }
> = {
  idle: {
    label: "Idle",
    dot: "bg-slate-400",
    className: "border-[var(--color-border-primary)] bg-[color:color-mix(in_srgb,var(--color-bg-secondary)_80%,transparent)] text-[var(--color-text-secondary)]",
  },
  connecting: {
    label: "Connecting",
    dot: "bg-amber-400 animate-pulse",
    className: "border-amber-900/50 bg-amber-950/30 text-amber-200",
  },
  connected: {
    label: "Live",
    dot: "bg-emerald-400",
    className: "border-emerald-900/50 bg-emerald-950/30 text-emerald-200",
  },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-amber-400 animate-pulse",
    className: "border-amber-900/50 bg-amber-950/30 text-amber-200",
  },
  disconnected: {
    label: "Disconnected",
    dot: "bg-slate-400",
    className: "border-[var(--color-border-primary)] bg-[color:color-mix(in_srgb,var(--color-bg-secondary)_80%,transparent)] text-[var(--color-text-secondary)]",
  },
  error: {
    label: "Connection error",
    dot: "bg-rose-400",
    className: "border-rose-900/50 bg-rose-950/30 text-rose-200",
  },
};

export default function ConnectionStatusBadge({
  status,
}: {
  status: ConnectionStatus;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.idle;

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm ${meta.className}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
