import { useMemo, useState } from 'react';
import { formatBalance, truncateAddress } from '@/utils/formatters';
import type { VaultTx, VaultTxType, VaultTxStatus } from '@/utils/contractHelpers';
import CopyButton from './CopyButton';
import { TransactionSkeleton } from './Skeletons';
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

type TypeFilter = 'all' | VaultTxType;
type StatusFilter = 'all' | VaultTxStatus;

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdraw', label: 'Withdraw' },
  { value: 'claim', label: 'Claim' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

function statusStyles(status: VaultTx['status']) {
  if (status === 'success') return 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200';
  if (status === 'failed') return 'border-rose-900/50 bg-rose-950/30 text-rose-200';
  return 'border-border-primary bg-background-secondary/30 text-text-primary';
}

function typeLabel(type: VaultTx['type']) {
  if (type === 'deposit') return 'Deposit';
  if (type === 'withdraw') return 'Withdraw';
  return 'Claim';
type TypeFilter = "all" | VaultTxType;
type StatusFilter = "all" | VaultTxStatus;
type SortKey = "createdAt" | "amount";
type SortDirection = "asc" | "desc";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "deposit", label: "Deposit" },
  { value: "withdraw", label: "Withdraw" },
  { value: "claim", label: "Claim" }
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "success", label: "Success" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" }
];

// Mock data for testing CSV export
const MOCK_TRANSACTIONS: VaultTx[] = [
  {
    id: "mock_tx_001",
    type: "deposit",
    amount: "1000.50",
    status: "success",
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    hash: "CDLZFC3SYJYD5T5Z3STYN3ZK3BXP5GTFBV3XZYOYF2U2E3F2K5N2K2I"
  },
  {
    id: "mock_tx_002",
    type: "deposit",
    amount: "2500.75",
    status: "success",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    hash: "GBP5T3SYJYD5T5Z3STYN3ZK3BXP5GTFBV3XZYOYF2U2E3F2K5N2K2K"
  },
  {
    id: "mock_tx_003",
    type: "withdraw",
    amount: "500.25",
    status: "success",
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    hash: "SALLC3SYJYD5T5Z3STYN3ZK3BXP5GTFBV3XZYOYF2U2E3F2K5N2K2M"
  },
  {
    id: "mock_tx_004",
    type: "claim",
    amount: "75.50",
    status: "pending",
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    hash: null
  },
  {
    id: "mock_tx_005",
    type: "deposit",
    amount: "5000.1234567",
    status: "success",
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    hash: "TALLC3SYJYD5T5Z3STYN3ZK3BXP5GTFBV3XZYOYF2U2E3F2K5N2K2N"
  },
  {
    id: "mock_tx_006",
    type: "withdraw",
    amount: "1250.00",
    status: "failed",
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    hash: "MALLC3SYJYD5T5Z3STYN3ZK3BXP5GTFBV3XZYOYF2U2E3F2K5N2K2O"
  },
  {
    id: "mock_tx_007",
    type: "deposit",
    amount: "750.99",
    status: "success",
    createdAt: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
    hash: "NALLC3SYJYD5T5Z3STYN3ZK3BXP5GTFBV3XZYOYF2U2E3F2K5N2K2P"
  },
  {
    id: "mock_tx_008",
    type: "claim",
    amount: "125.75",
    status: "success",
    createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    hash: "OALLC3SYJYD5T5Z3STYN3ZK3BXP5GTFBV3XZYOYF2U2E3F2K5N2K2Q"
  },
  {
    id: "mock_tx_009",
    type: "withdraw",
    amount: "3000.00",
    status: "pending",
    createdAt: new Date(Date.now() - 691200000).toISOString(), // 8 days ago
    hash: "PALLC3SYJYD5T5Z3STYN3ZK3BXP5GTFBV3XZYOYF2U2E3F2K5N2AJE"
  },
  {
    id: "mock_tx_010",
    type: "deposit",
    amount: "0.0000001",
    status: "success",
    createdAt: new Date(Date.now() - 777600000).toISOString(), // 9 days ago
    hash: "PALLC3SYJYD5T5Z3STYN3ZK3BXP5GTFBV3XZYOYF2U2E3F2K5N2K2R"
  }
];

function statusStyles(status: VaultTx["status"]) {
  if (status === "success") return "border-emerald-900/50 bg-emerald-950/30 text-emerald-200";
  if (status === "failed") return "border-rose-900/50 bg-rose-950/30 text-rose-200";
  return "border-border-primary bg-background-secondary/30 text-text-primary";
}

function typeLabel(type: VaultTxType) {
  if (type === "deposit") return "Deposit";
  if (type === "withdraw") return "Withdraw";
  return "Claim";
}

function sortIcon(active: boolean, direction: SortDirection) {
  if (!active) return "↕";
  return direction === "asc" ? "↑" : "↓";
}

const selectClassName =
  'rounded-lg border border-border-primary bg-background-secondary/30 px-3 py-1.5 text-xs text-text-primary outline-none transition hover:bg-background-secondary/60 focus:border-axion-500';

export default function TransactionHistory({
  isConnected,
  address,
  isLoading: externalIsLoading,
  transactions: externalTransactions,
  onClaimRewards,
  isClaiming
}: TransactionHistoryProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
}: Props) {
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

  const hasActiveFilter = typeFilter !== 'all' || statusFilter !== 'all';
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
  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      console.warn("No transactions to export");
      return;
    }
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const clearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
  };

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-text-primary">Transaction history</div>
          <div className="mt-1 text-xs text-text-muted">
            {isConnected && publicKey ? `Recent vault activity for ${shortenAddress(publicKey, 6)}` : "Connect a wallet to view history."}
          </div>
          {/* Show summary stats when there are transactions */}
          {transactions.length > 0 && (
            <div className="mt-2 text-xs text-text-muted space-x-3">
              <span>Total: {summary.totalCount} txns</span>
              <span>Deposits: {summary.totalDeposits} XLM</span>
              <span>Withdrawals: {summary.totalWithdrawals} XLM</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Mock Data Toggle Button - Only shows in development or when no wallet connected */}
          {(process.env.NODE_ENV === 'development' || !isConnected) && (
            <button
              type="button"
              onClick={() => setUseMockData(!useMockData)}
              aria-label={useMockData ? "Switch to real data" : "Use mock data for testing"}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition border ${
                useMockData 
                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30" 
                  : "bg-background-secondary/30 text-text-secondary border-border-primary hover:bg-background-secondary/60"
              }`}
            >
              {useMockData ? (
                <>
                  <svg className="inline-block w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Using Mock Data ✓
                </>
              ) : (
                <>
                  <svg className="inline-block w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Test Mock Data
                </>
              )}
            </button>
          )}
          
          {/* Export CSV Button */}
          {(isConnected || useMockData) && transactions.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={isExporting || filteredTransactions.length === 0}
              aria-label={isExporting ? "Exporting transactions..." : "Export transactions to CSV"}
              className="rounded-xl bg-axion-500/10 px-4 py-2 text-sm font-medium text-axion-400 transition hover:bg-axion-500/20 disabled:cursor-not-allowed disabled:opacity-60 border border-axion-500/20"
            >
              {isExporting ? (
                <>
                  <svg className="inline-block w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="inline-block w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </>
              )}
            </button>
          )}
          
          {/* Claim Rewards Button - Only show when using real data and connected */}
          {!useMockData && (
            <button
              type="button"
              onClick={onClaimRewards}
              disabled={!isConnected || isClaiming}
              aria-label={isClaiming ? "Claiming rewards" : "Claim your earned rewards"}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClaiming ? "Claiming..." : "Claim Rewards"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClaimRewards}
          disabled={!isConnected || isClaiming}
          aria-label={isClaiming ? "Claiming rewards" : "Claim your earned rewards"}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isClaiming ? 'Claiming...' : 'Claim Rewards'}
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
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {hasActiveFilter ? (
          <button
            type="button"
            onClick={clearFilters}
            aria-label="Clear all transaction filters"
            className="text-xs text-axion-400 transition hover:text-axion-300 focus:outline-none focus:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border-primary" role="table" aria-label="Transaction History">
        <div className="grid grid-cols-[1.1fr_1fr_1.2fr_1fr] gap-3 bg-background-secondary/20 px-4 py-3 text-xs font-semibold text-text-secondary" role="row">
          <button type="button" role="columnheader" onClick={() => toggleSort("createdAt")} className="text-left">
            Type
          </button>
          <button type="button" role="columnheader" onClick={() => toggleSort("amount")} className="text-left">
            Amount {sortIcon(sortKey === "amount", sortDirection)}
          </button>
          <button type="button" role="columnheader" onClick={() => toggleSort("createdAt")} className="text-left">
            Created {sortIcon(sortKey === "createdAt", sortDirection)}
          </button>
          <div role="columnheader">Status</div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-border-primary">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] gap-3 bg-background-secondary/20 px-4 py-3 text-xs text-text-secondary">
          <div>Type</div>
          <div>Amount</div>
          <div>Created</div>
          <div>Status</div>
        </div>
        <div className="divide-y divide-border-primary" role="rowgroup">
          {isLoading ? (
            <TransactionSkeleton />
          ) : sortedTransactions.length === 0 ? (
            <div className="px-4 py-6 text-sm text-text-secondary" role="row">
              <div role="cell" className="col-span-4">
                {hasActiveFilter ? "No transactions match the selected filters." : "No transactions yet."}
              </div>
            <div className="px-4 py-6 text-sm text-text-secondary">
              {hasActiveFilter ? "No transactions match the selected filters." : "No transactions yet."}
            </div>
          ) : (
            sortedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="grid grid-cols-[1.1fr_1fr_1.2fr_1fr] items-center gap-3 px-4 py-3 text-sm"
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

      {hasActiveFilter && !isLoading && sortedTransactions.length > 0 ? (
        <div className="mt-3 text-xs text-text-muted">
          Showing {sortedTransactions.length} of {transactions.length} transactions
        </div>
      ) : null}

      {/* Mock data indicator banner */}
      {useMockData && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>You&apos;re currently viewing mock transaction data for testing. Click &quot;Using Mock Data ✓&quot; to switch back to real data when your wallet is connected.</span>
          </div>
        </div>
      )}
    </section>
  );
}