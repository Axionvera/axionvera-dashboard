import { useState } from "react";

import { NETWORK } from "@/utils/networkConfig";
import type { StellarNetwork } from "@/utils/networkConfig";

type NetworkMismatchBannerProps = {
  actualNetwork: StellarNetwork;
};

export default function NetworkMismatchBanner({
  actualNetwork,
}: NetworkMismatchBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative z-30 border-b border-amber-500/30 bg-amber-950/40 px-4 py-3 text-amber-100 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>

        <div className="flex-1 text-sm">
          <p className="font-semibold text-amber-200">
            Network Mismatch Detected
          </p>
          <p className="mt-0.5 text-amber-100/90">
            Please switch your Freighter wallet to{" "}
            <span className="font-semibold capitalize">{NETWORK}</span> to
            continue. Current network:{" "}
            <span className="font-semibold capitalize">{actualNetwork}</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss network mismatch warning"
          className="shrink-0 rounded-lg p-1 text-amber-300 transition hover:bg-amber-500/20 hover:text-amber-100"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
