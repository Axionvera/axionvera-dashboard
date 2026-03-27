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
  if (status === "success") return "border-emerald-900/50 bg-emerald-950/30 text-emerald-200";
  if (status === "failed") return "border-rose-900/50 bg-rose-950/30 text-rose-200";
  return "border-border-primary bg-background-secondary/30 text-text-primary";
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
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-text-primary">Transaction history</div>
          <div className="mt-1 text-xs text-text-muted">
            {isConnected && address ? `Recent vault activity for ${shortenAddress(address, 6)}` : "Connect a wallet to view history."}
          </div>
        </div>
        <button
          type="button"
          onClick={onClaimRewards}
          disabled={!isConnected || isClaiming}
          aria-label={isClaiming ? "Claiming rewards" : "Claim your earned rewards"}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isClaiming ? "Claiming..." : "Claim Rewards"}
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border-primary">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] gap-3 bg-background-secondary/20 px-4 py-3 text-xs text-text-secondary">
          <div>Type</div>
          <div>Amount</div>
          <div>Created</div>
          <div>Status</div>
        </div>
        <div className="divide-y divide-border-primary">
          {isLoading ? (
            <div className="px-4 py-6 text-sm text-text-secondary">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="px-4 py-6 text-sm text-text-secondary">No transactions yet.</div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="text-text-primary">{typeLabel(tx.type)}</div>
                <div className="text-text-primary">{formatAmount(tx.amount)}</div>
                <div className="text-text-muted">{new Date(tx.createdAt).toLocaleString()}</div>
                <div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs capitalize ${statusStyles(tx.status)}`}>
                    {tx.status}
                  </span>
                  {tx.hash ? (
                    <div className="mt-1 text-xs text-text-muted">Hash: {shortenAddress(tx.hash, 8)}</div>
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
