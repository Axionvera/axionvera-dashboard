import { formatAmount } from "@/utils/contractHelpers";
import { StatisticsSkeleton } from "./Skeletons";
import { AppTooltip } from "./AppTooltip";
import { GLOSSARY } from "@/utils/glossary";

type ClaimRewardsCardProps = {
  isConnected: boolean;
  rewards: string;
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;
  onClaim: () => Promise<void>;
};

export default function ClaimRewardsCard({
  isConnected,
  rewards,
  isLoading,
  isClaiming,
  error,
  onClaim
}: ClaimRewardsCardProps) {
  if (isLoading) return <StatisticsSkeleton />;

  const rewardsAmount = Number(rewards);
  const hasRewards = rewardsAmount > 0;

  const handleClaim = async () => {
    try {
      await onClaim();
    } catch (err) {
      console.error("Claim error:", err);
    }
  };

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-text-primary">Claim Rewards</div>
          <div className="mt-1 text-xs text-text-muted">
            {isConnected ? "Claim your accrued vault rewards." : "Connect a wallet to claim rewards."}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-border-primary bg-background-secondary/20 p-4">
          <div className="flex items-baseline gap-1.5">
            <div className="text-xs text-text-muted">Accrued Rewards</div>
            <AppTooltip content={GLOSSARY.tvl}>
              <span className="cursor-help text-[10px] font-semibold uppercase tracking-wider text-text-tertiary underline decoration-dotted decoration-border-tertiary underline-offset-2 transition-colors hover:text-text-muted">
                APY
              </span>
            </AppTooltip>
          </div>
          <div className="mt-2 text-3xl font-semibold text-text-primary">{formatAmount(rewards)}</div>
          <div className="mt-2 text-xs text-text-muted">
            {!hasRewards ? "No rewards available to claim." : "Ready to claim your rewards."}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200/50 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleClaim}
          disabled={!isConnected || !hasRewards || isClaiming}
          aria-label={isClaiming ? "Claiming rewards" : "Claim rewards"}
          className="w-full rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isClaiming ? "Claiming..." : "Claim Rewards"}
        </button>
      </div>
    </section>
  );
}
