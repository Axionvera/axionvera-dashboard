import { useState, useMemo } from "react";
import { type Proposal, type ProposalStatus, type Vote } from "@/utils/contractHelpersGovernance";
import ProposalCard from "./ProposalCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/design-system";

interface ProposalListProps {
  proposals: Proposal[];
  userVotes: Vote[];
  isLoading: boolean;
  selectedProposal: Proposal | null;
  onSelect: (proposal: Proposal) => void;
}

type StatusFilter = "all" | ProposalStatus;
type SortKey = "createdAt" | "votes" | "endingSoon";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "passed", label: "Passed" },
  { value: "rejected", label: "Rejected" },
  { value: "executed", label: "Executed" },
  { value: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt", label: "Newest" },
  { value: "votes", label: "Most Votes" },
  { value: "endingSoon", label: "Ending Soon" },
];

export default function ProposalList({
  proposals,
  userVotes,
  isLoading,
  selectedProposal,
  onSelect,
}: ProposalListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProposals = useMemo(() => {
    let result = [...proposals];

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.proposer.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortKey === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortKey === "votes") {
        const totalA = Number(a.votesFor) + Number(a.votesAgainst) + Number(a.votesAbstain);
        const totalB = Number(b.votesFor) + Number(b.votesAgainst) + Number(b.votesAbstain);
        return totalB - totalA;
      }
      if (sortKey === "endingSoon") {
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      }
      return 0;
    });

    return result;
  }, [proposals, statusFilter, sortKey, searchQuery]);

  const hasActiveFilter = statusFilter !== "all" || searchQuery.trim();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select
            id="proposal-status-filter"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
          <Select
            id="proposal-sort"
            aria-label="Sort proposals"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div className="relative">
          <label htmlFor="proposal-search" className="sr-only">Search proposals</label>
          <input
            id="proposal-search"
            type="search"
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border-primary bg-background-secondary/30 px-3 py-1.5 pl-9 text-xs text-text-primary outline-none transition placeholder:text-text-muted focus:border-axion-500 sm:w-64"
          />
          <svg
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoading ? (
          <>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </>
        ) : filteredProposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
            <div className="mb-3 rounded-full bg-background-secondary p-3" aria-hidden="true">
              <svg
                className="h-6 w-6 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-text-secondary">
              {hasActiveFilter
                ? "No proposals match the selected filters."
                : "No proposals yet."}
            </p>
          </div>
        ) : (
          filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              userVotes={userVotes}
              onSelect={onSelect}
              isSelected={selectedProposal?.id === proposal.id}
            />
          ))
        )}
      </div>

      {hasActiveFilter && !isLoading && filteredProposals.length > 0 && (
        <p className="mt-3 text-center text-xs text-text-muted" aria-live="polite" aria-atomic="true">
          Showing {filteredProposals.length} of {proposals.length} proposals
        </p>
      )}
    </div>
  );
}
