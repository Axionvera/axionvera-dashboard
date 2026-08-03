import { shortenAddress } from "@/utils/contractHelpers";
import type { ActivityEvent, ActivityType } from "@/services/events/types";

const TYPE_META: Record<ActivityType, { label: string; icon: string; className: string }> = {
  deposit: {
    label: "Deposit",
    icon: "↓",
    className: "border-emerald-900/50 bg-emerald-950/30 text-emerald-200",
  },
  withdrawal: {
    label: "Withdrawal",
    icon: "↑",
    className: "border-sky-900/50 bg-sky-950/30 text-sky-200",
  },
  reward: {
    label: "Reward",
    icon: "★",
    className: "border-amber-900/50 bg-amber-950/30 text-amber-200",
  },
  governance: {
    label: "Governance",
    icon: "⚖",
    className: "border-violet-900/50 bg-violet-950/30 text-violet-200",
  },
  unknown: {
    label: "Event",
    icon: "•",
    className: "border-[var(--color-border-primary)] bg-[color:color-mix(in_srgb,var(--color-bg-secondary)_80%,transparent)] text-[var(--color-text-secondary)]",
  },
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString();
}

export default function ActivityItem({ event }: { event: ActivityEvent }) {
  const meta = TYPE_META[event.type] ?? TYPE_META.unknown;

  return (
    <li className="flex items-start gap-3 rounded-xl border border-[var(--color-border-primary)] bg-[color:color-mix(in_srgb,var(--color-bg-primary)_92%,var(--color-bg-secondary))] p-3 shadow-sm">
      <span
        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm ${meta.className}`}
        aria-hidden="true"
      >
        {meta.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
            {meta.label}
            {event.name && event.name !== "unknown" ? (
              <span className="ml-1 font-normal text-[var(--color-text-secondary)]">({event.name})</span>
            ) : null}
          </span>
          <time
            className="shrink-0 text-xs text-[var(--color-text-secondary)]"
            dateTime={event.timestamp}
          >
            {formatTimestamp(event.timestamp)}
          </time>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-secondary)]">
          <span>Ledger #{event.ledger}</span>
          {event.contractId && event.contractId !== "unknown" ? (
            <span className="font-mono">{shortenAddress(event.contractId)}</span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
