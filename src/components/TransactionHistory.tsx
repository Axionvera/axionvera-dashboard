import { useMemo, useState } from "react";
import { formatAmount, shortenAddress } from "@/utils/contractHelpers";
import type { VaultTx, VaultTxType, VaultTxStatus } from "@/utils/contractHelpers";
import CopyButton from "./CopyButton";
import { TransactionSkeleton } from "./Skeletons";

type TransactionHistoryProps = {
  isConnected: boolean;
  publicKey: string | null;
  isLoading: boolean;
  transactions: VaultTx[];
  onClaimRewards: () => Promise<void>;
  isClaiming: boolean;
};

type TypeFilter = "all" | VaultTxType;
type StatusFilter = "all" | VaultTxStatus;
type SortKey = "createdAt" | "amount";
type SortDirection = "asc" | "desc";

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "deposit", label: "Deposit" },
  { value: "withdraw", label: "Withdraw" },
  { value: "claim", label: "Claim" }
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "success", label: "Success" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" }
];

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

function sortIcon(active: boolean, direction: SortDirection) {
  if (!active) return "↕";
  return direction === "asc" ? "↑" : "↓";
}

const selectClassName =
  "rounded-lg border border-border-primary bg-background-secondary/30 px-3 py-1.5 text-xs text-text-primary outline-none transition hover:bg-background-secondary/60 focus:border-axion-500";

export default function TransactionHistory({
  isConnected,
  publicKey,
  isLoading,
  transactions,
  onClaimRewards,
  isClaiming
}: TransactionHistoryProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      return true;
    });
  }, [transactions, typeFilter, statusFilter]);

  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions];
    sorted.sort((a, b) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "amount") {
        return (Number(a.amount) - Number(b.amount)) * directionFactor;
      }

      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return (dateA - dateB) * directionFactor;
    });
    return sorted;
  }, [filteredTransactions, sortKey, sortDirection]);

  const hasActiveFilter = typeFilter !== "all" || statusFilter !== "all";

  const toggleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((previousDirection) => (previousDirection === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("desc");
  };

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-text-primary">Transaction history</div>
          <div className="mt-1 text-xs text-text-muted">
            {isConnected && publicKey ? `Recent vault activity for ${shortenAddress(publicKey, 6)}` : "Connect a wallet to view history."}
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="type-filter" className="text-xs text-text-muted">Type</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className={selectClassName}
            aria-label="Filter transactions by type"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-xs text-text-muted">Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={selectClassName}
            aria-label="Filter transactions by status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {hasActiveFilter ? (
          <button
            type="button"
            onClick={() => {
              setTypeFilter("all");
              setStatusFilter("all");
            }}
            aria-label="Clear all transaction filters"
            className="text-xs text-axion-400 transition hover:text-axion-300 focus:outline-none focus:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border-primary" role="table" aria-label="Transaction History">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] gap-3 bg-background-secondary/20 px-4 py-3 text-xs text-text-secondary font-semibold" role="row">
          <div role="columnheader">Type</div>
          <div role="columnheader">Amount</div>
          <div role="columnheader">Created</div>
          <div role="columnheader">Status</div>
        </div>
        <div className="divide-y divide-border-primary" role="rowgroup">
          {isLoading ? (
            <TransactionSkeleton />
          ) : filteredTransactions.length === 0 ? (
            <div className="px-4 py-6 text-sm text-text-secondary" role="row">
              <div role="cell" className="col-span-4">
                {hasActiveFilter ? "No transactions match the selected filters." : "No transactions yet."}
              </div>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] items-center gap-3 px-4 py-3 text-sm"
                role="row"
              >
                <div className="text-text-primary" role="cell">{typeLabel(tx.type)}</div>
                <div className="text-text-primary" role="cell">{formatAmount(tx.amount)}</div>
                <div className="text-text-muted" role="cell">{new Date(tx.createdAt).toLocaleString()}</div>
                <div role="cell">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles(tx.status)}`}>
                    {tx.status}
                  </span>
                  {tx.hash ? (
                    <div className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                      <span>Hash: {shortenAddress(tx.hash, 8)}</span>
                      <CopyButton text={tx.hash} label="Copy hash" size="sm" />
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {hasActiveFilter && !isLoading && filteredTransactions.length > 0 ? (
        <div className="mt-3 text-xs text-text-muted">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      ) : null}
    </section>
  );
}
