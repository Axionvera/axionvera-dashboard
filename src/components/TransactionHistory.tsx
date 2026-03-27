import { formatAmount, shortenAddress } from "@/utils/contractHelpers";
import type { VaultTx } from "@/utils/contractHelpers";

type TransactionHistoryProps = {
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
  transactions: VaultTx[];
  onClaimRewards: () => Promise<void>;
  isClaiming: boolean;
};

function statusStyles(status: VaultTx["status"]) {
  if (status === "success") return "border-emerald-200/50 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-200";
  if (status === "failed") return "border-rose-200/50 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/30 text-rose-700 dark:text-rose-200";
  return "border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 text-slate-700 dark:text-slate-200";
}

function typeLabel(type: VaultTx["type"]) {
  if (type === "deposit") return "Deposit";
  if (type === "withdraw") return "Withdraw";
  return "Claim";
}

export default function TransactionHistory({
  isConnected,
  address,
  isLoading,
  transactions,
  onClaimRewards,
  isClaiming
}: TransactionHistoryProps) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/30 p-6 shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Transaction history</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isConnected && address ? `Recent vault activity for ${shortenAddress(address, 6)}` : "Connect a wallet to view history."}
          </div>
        </div>
        <button
          type="button"
          onClick={onClaimRewards}
          disabled={!isConnected || isClaiming}
          aria-label={isClaiming ? "Claiming rewards" : "Claim your earned rewards"}
          className="rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-sm font-medium text-slate-700 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isClaiming ? "Claiming..." : "Claim Rewards"}
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] gap-3 bg-slate-50/50 dark:bg-slate-900/20 px-4 py-3 text-xs text-slate-500 dark:text-slate-300">
          <div>Type</div>
          <div>Amount</div>
          <div>Created</div>
          <div>Status</div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {isLoading ? (
            <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-300">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-300">No transactions yet.</div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="text-slate-900 dark:text-white font-medium">{typeLabel(tx.type)}</div>
                <div className="text-slate-700 dark:text-slate-200">{formatAmount(tx.amount)}</div>
                <div className="text-slate-500 dark:text-slate-400 font-mono text-xs">{new Date(tx.createdAt).toLocaleString()}</div>
                <div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles(tx.status)}`}>
                    {tx.status}
                  </span>
                  {tx.hash ? (
                    <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">Hash: {shortenAddress(tx.hash, 8)}</div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
