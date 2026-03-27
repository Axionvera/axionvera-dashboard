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
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/30 p-6 shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Vault balance</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isConnected && address ? `Wallet: ${shortenAddress(address, 6)}` : "Connect a wallet to view balances."}
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!isConnected || isLoading}
          aria-label={isLoading ? "Loading vault balances" : "Refresh vault balances"}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition hover:bg-slate-200/50 dark:hover:bg-slate-900/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Balance</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{formatAmount(balance)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Rewards</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{formatAmount(rewards)}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Claim rewards to add them to your balance.</div>
        </div>
        {error ? (
          <div className="rounded-2xl border border-rose-200/50 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-200">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
