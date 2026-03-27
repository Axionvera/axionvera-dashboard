import { formatAmount, shortenAddress } from "@/utils/contractHelpers";

type BalanceCardProps = {
  isConnected: boolean;
  address: string | null;
  balance: string;
  rewards: string;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

export default function BalanceCard({
  isConnected,
  address,
  balance,
  rewards,
  isLoading,
  error,
  onRefresh
}: BalanceCardProps) {
  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-text-primary">Vault balance</div>
          <div className="mt-1 text-xs text-text-muted">
            {isConnected && address ? `Wallet: ${shortenAddress(address, 6)}` : "Connect a wallet to view balances."}
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!isConnected || isLoading}
          aria-label={isLoading ? "Loading vault balances" : "Refresh vault balances"}
          className="rounded-xl border border-border-primary bg-background-secondary/30 px-3 py-2 text-xs font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-border-primary bg-background-secondary/20 p-4">
          <div className="text-xs text-text-muted">Balance</div>
          <div className="mt-2 text-3xl font-semibold text-text-primary">{formatAmount(balance)}</div>
        </div>
        <div className="rounded-2xl border border-border-primary bg-background-secondary/20 p-4">
          <div className="text-xs text-text-muted">Rewards</div>
          <div className="mt-2 text-2xl font-semibold text-text-primary">{formatAmount(rewards)}</div>
          <div className="mt-1 text-xs text-text-muted">Claim rewards to add them to your balance.</div>
        </div>
        {error ? (
          <div className="rounded-2xl border border-rose-900/50 bg-rose-950/30 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
