import { useMemo, useState } from "react";
import { formatAmount, shortenAddress } from "@/utils/contractHelpers";
import type { VaultTx, VaultTxType, VaultTxStatus } from "@/utils/contractHelpers";
import { CopyButton, TransactionSkeleton } from "@/components/ui";
import { Badge, Button, Select } from "@/design-system";
import type { BadgeVariant } from "@/design-system";

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

function statusToBadgeVariant(status: VaultTx["status"]): BadgeVariant {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  return "pending";
}

function typeLabel(type: VaultTx["type"]) {
  if (type === "deposit") return "Deposit";
  if (type === "withdraw") return "Withdraw";
  return "Claim";
}

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
        <Button
          variant="secondary"
          size="sm"
          onClick={onClaimRewards}
          disabled={!isConnected || isClaiming}
          loading={isClaiming}
          loadingLabel="Claiming rewards"
        >
          {isClaiming ? "Claiming…" : "Claim Rewards"}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Select
          id="type-filter"
          aria-label="Filter by type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
        <Select
          id="status-filter"
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setTypeFilter("all"); setStatusFilter("all"); }}
            aria-label="Clear all transaction filters"
          >
            Clear filters
          </Button>
        )}
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
          ) : sortedTransactions.length === 0 ? (
            <div className="px-4 py-6 text-sm text-text-secondary" role="row">
              <div role="cell" className="col-span-4">
                {hasActiveFilter ? "No transactions match the selected filters." : "No transactions yet."}
              </div>
            </div>
          ) : (
            sortedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] items-center gap-3 px-4 py-3 text-sm"
                role="row"
              >
                <div className="text-text-primary" role="cell">{typeLabel(tx.type)}</div>
                <div className="text-text-primary" role="cell">{formatAmount(tx.amount)}</div>
                <div className="text-text-muted" role="cell">{new Date(tx.createdAt).toLocaleString()}</div>
                <div role="cell">
                  <Badge variant={statusToBadgeVariant(tx.status)}>{tx.status}</Badge>
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

      {hasActiveFilter && !isLoading && sortedTransactions.length > 0 ? (
        <div className="mt-3 text-xs text-text-muted" aria-live="polite" aria-atomic="true">
          Showing {sortedTransactions.length} of {transactions.length} transactions
        </div>
      ) : null}
    </section>
  );
}
