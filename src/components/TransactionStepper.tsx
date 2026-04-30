import type { TxStep } from "@/utils/pollTransaction";

const STEPS: { key: TxStep; label: string }[] = [
  { key: "signed", label: "Signed" },
  { key: "submitted", label: "Submitted to Network" },
  { key: "confirmed", label: "Confirmed in Ledger" }
];

const STEP_ORDER: TxStep[] = ["signed", "submitted", "confirming", "confirmed"];

function getStepState(stepKey: TxStep, currentStep: TxStep): "complete" | "active" | "pending" {
  const stepIdx = STEP_ORDER.indexOf(stepKey === "confirming" ? "submitted" : stepKey);
  const currentIdx = STEP_ORDER.indexOf(currentStep);
  if (currentIdx > stepIdx) return "complete";
  if (currentIdx === stepIdx || (stepKey === "submitted" && currentStep === "confirming")) return "active";
  return "pending";
}

type Props = {
  txStep: TxStep;
};

export function TransactionStepper({ txStep }: Props) {
  return (
    <ol
      aria-label="Transaction progress"
      className="flex items-center gap-0"
    >
      {STEPS.map((step, i) => {
        const state = getStepState(step.key, txStep);
        const isLast = i === STEPS.length - 1;

        return (
          <li key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                aria-current={state === "active" ? "step" : undefined}
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  state === "complete"
                    ? "border-axion-500 bg-axion-500 text-white"
                    : state === "active"
                      ? "border-axion-400 bg-axion-500/20 text-axion-300"
                      : "border-border-primary bg-background-secondary/30 text-text-muted"
                ].join(" ")}
              >
                {state === "complete" ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : state === "active" ? (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={[
                  "text-center text-[10px] leading-tight",
                  state === "pending" ? "text-text-muted" : "text-text-primary"
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div
                aria-hidden="true"
                className={[
                  "mx-1 mb-4 h-px flex-1 transition-colors",
                  state === "complete" ? "bg-axion-500" : "bg-border-primary"
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
