/**
 * @module components/forms/SimulationPanel
 *
 * Inline simulation result panel that sits inside the form, directly below
 * the amount field.  It shows real-time feedback as the user types (via the
 * debounced `simulateLive` from `useSimulation`) and gives a step-by-step
 * checklist when the simulation is ready.
 *
 * States
 * ------
 * idle    → hidden (renders nothing)
 * loading → shimmer skeleton rows
 * ready   → step checklist + projected outcome summary
 * error   → structured error card with icon, typed message & suggested fix
 */

import type {
  SimulationOutcome,
  SimulationStep,
  SimulationErrorCode,
} from "@/services/sdk";
import { formatAmount } from "@/utils/contractHelpers";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Shimmer skeleton row for loading state */
function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center justify-between py-2">
      <div className="h-3 w-28 rounded-full bg-background-secondary/60" />
      <div className="h-3 w-16 rounded-full bg-background-secondary/60" />
    </div>
  );
}

/** Individual step row in the checklist */
function StepRow({ step }: { step: SimulationStep }) {
  const icons: Record<SimulationStep["status"], string> = {
    pending: "○",
    ok: "✓",
    warn: "⚠",
    error: "✕",
  };
  const colors: Record<SimulationStep["status"], string> = {
    pending: "text-text-muted",
    ok: "text-emerald-400",
    warn: "text-amber-400",
    error: "text-rose-400",
  };

  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <div className="flex items-center gap-2">
        <span className={`font-bold ${colors[step.status]}`} aria-hidden="true">
          {icons[step.status]}
        </span>
        <span className="text-text-secondary">{step.label}</span>
      </div>
      {step.detail && (
        <span className={`shrink-0 font-medium ${colors[step.status]}`}>
          {step.detail}
        </span>
      )}
    </div>
  );
}

/** Error icon SVG */
function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/** Warning banner for non-fatal notices */
function WarningBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-900/40 bg-amber-950/25 px-3 py-2 text-xs text-amber-200">
      <span className="mt-0.5 shrink-0 font-bold text-amber-400" aria-hidden="true">
        ⚠
      </span>
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outcome summary row
// ---------------------------------------------------------------------------

function OutcomeRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "positive" | "negative" | "neutral";
}) {
  const color =
    highlight === "positive"
      ? "text-emerald-400"
      : highlight === "negative"
        ? "text-rose-400"
        : "text-text-primary";

  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-text-muted">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface SimulationPanelProps {
  status: "idle" | "loading" | "ready" | "error";
  outcome: SimulationOutcome | null;
  steps: SimulationStep[];
  warnings: string[];
  error: string | null;
  errorCode: SimulationErrorCode | null;
  errorFix: string | null;
}

export function SimulationPanel({
  status,
  outcome,
  steps,
  warnings,
  error,
  errorFix,
}: SimulationPanelProps) {
  // Render nothing when idle
  if (status === "idle") return null;

  const isDeposit = outcome?.type === "deposit";

  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
      aria-atomic="false"
      className="overflow-hidden rounded-xl border border-border-primary bg-background-secondary/20 transition-all duration-300"
    >
      {/* ── Loading ── */}
      {status === "loading" && (
        <div className="px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Simulating…
          </p>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {/* ── Error ── */}
      {status === "error" && (
        <div className="flex gap-3 px-4 py-3">
          <ErrorIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-rose-300">{error}</p>
            {errorFix && (
              <p className="mt-0.5 text-[11px] text-rose-400/70">{errorFix}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Ready ── */}
      {status === "ready" && outcome && (
        <div className="px-4 py-3">
          {/* Step checklist */}
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Simulation Steps
          </p>
          <div className="divide-y divide-border-primary/30">
            {steps.map((step, i) => (
              <StepRow key={i} step={step} />
            ))}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-border-primary/50" />

          {/* Outcome summary */}
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Projected Outcome
          </p>
          <OutcomeRow
            label="Current Balance"
            value={`${formatAmount(outcome.currentBalance)} XLM`}
          />
          <OutcomeRow
            label="Projected Balance"
            value={`${formatAmount(outcome.projectedBalance)} XLM`}
            highlight={isDeposit ? "positive" : "neutral"}
          />
          {isDeposit && (
            <OutcomeRow
              label="Projected Rewards"
              value={`${formatAmount(outcome.projectedRewards)} XLM`}
              highlight="positive"
            />
          )}
          <OutcomeRow
            label="Est. Network Fee"
            value={`~${outcome.estimatedFee} XLM`}
          />

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {warnings.map((w, i) => (
                <WarningBanner key={i} message={w} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
