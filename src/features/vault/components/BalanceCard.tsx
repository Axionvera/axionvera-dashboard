import { useCallback, useEffect, useRef, useState } from "react";
import { formatAmount, shortenAddress } from "@/utils/contractHelpers";
import { transformTrackedValue, extractValue } from "@/utils/provenance";
import type { MaybeTracked } from "@/types/provenance";
import { ProvenanceViewer } from "@/features/diagnostics";
import { AppTooltip, StatisticsSkeleton } from "@/components/ui";
import { GLOSSARY } from "@/utils/glossary";

type BalanceCardProps = {
  isConnected: boolean;
  publicKey: string | null;
  balance: MaybeTracked<string>;
  rewards: MaybeTracked<string>;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

const AUTO_REFRESH_INTERVAL = 30_000; // 30 seconds

export default function BalanceCard({
  isConnected,
  publicKey,
  balance,
  rewards,
  isLoading,
  error,
  onRefresh,
}: BalanceCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || isLoading) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, isLoading, onRefresh]);

  // Auto-refresh on a timer while wallet is connected
  useEffect(() => {
    if (!isConnected) return;

    intervalRef.current = setInterval(() => {
      handleRefresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isConnected, handleRefresh]);

  const isFetching = isLoading || isRefreshing;

  const displayBalanceTracked = transformTrackedValue(
    balance,
    "formatAmount",
    "BalanceCard",
    (val) => formatAmount(val)
  );

  const displayRewardsTracked = transformTrackedValue(
    rewards,
    "formatAmount",
    "BalanceCard",
    (val) => formatAmount(val)
  );

  if (isFetching && !balance) return <StatisticsSkeleton />;

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-text-primary">
            Current Vault Balance
          </div>
          <div className="mt-1 text-xs text-text-muted">
            {isConnected && publicKey
              ? `Wallet: ${shortenAddress(publicKey, 6)}`
              : "Connect a wallet to view balances."}
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={!isConnected || isFetching}
          aria-label={isFetching ? "Loading vault balances" : "Refresh vault balances"}
          className="rounded-xl border border-border-primary bg-background-secondary/30 px-3 py-2 text-xs font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isFetching ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-border-primary bg-background-secondary/20 p-4">
          {isFetching ? (
            <div className="h-10 w-32 animate-pulse rounded-lg bg-background-secondary/60" />
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <div className="text-xs text-text-muted">Balance</div>
                <AppTooltip content={GLOSSARY.tvl}>
                  <span className="cursor-help text-[10px] font-semibold uppercase tracking-wider text-text-tertiary underline decoration-dotted decoration-border-tertiary underline-offset-2 transition-colors hover:text-text-muted">
                    TVL
                  </span>
                </AppTooltip>
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
                {extractValue(displayBalanceTracked)}
              </div>
              <ProvenanceViewer trackedValue={displayBalanceTracked} />
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border-primary bg-background-secondary/20 p-4">
          {isFetching ? (
            <div className="h-8 w-24 animate-pulse rounded-lg bg-background-secondary/60" />
          ) : (
            <>
              <div className="text-xs text-text-muted">Pending Rewards</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
                {extractValue(displayRewardsTracked)}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                Claim rewards to add them to your balance.
              </div>
              <ProvenanceViewer trackedValue={displayRewardsTracked} />
            </>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200/50 bg-rose-50/30 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}