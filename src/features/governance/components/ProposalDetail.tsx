import { useMemo, useState } from "react";
import {
  type Proposal,
  type Vote,
  type VoteChoice,
  type ProposalStatus,
} from "@/utils/contractHelpersGovernance";
import { shortenAddress, formatAmount } from "@/utils/contractHelpers";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert, Badge, Button, Spinner } from "@/design-system";
import type { BadgeVariant } from "@/design-system";

interface ProposalDetailProps {
  proposal: Proposal | null;
  votes: Vote[];
  userVotes: Vote[];
  isLoading: boolean;
  isSubmitting: boolean;
  voteStatus: "idle" | "pending" | "success" | "error";
  voteError: string | null;
  walletAddress: string | null;
  onVote: (choice: VoteChoice) => void;
  onBack: () => void;
}

function statusToBadgeVariant(status: ProposalStatus): BadgeVariant {
  const map: Record<ProposalStatus, BadgeVariant> = {
    active: "active", passed: "passed", rejected: "rejected",
    executed: "executed", cancelled: "cancelled",
  };
  return map[status];
}

function statusLabel(status: ProposalStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function timeRemaining(endDate: string, status: ProposalStatus) {
  if (status !== "active") return null;
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return "Voting ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days} days, ${hours} hours remaining`;
  if (hours > 0) return `${hours} hours, ${minutes} minutes remaining`;
  return `${minutes} minutes remaining`;
}

export default function ProposalDetail({
  proposal,
  votes,
  userVotes,
  isLoading,
  isSubmitting,
  voteStatus,
  voteError,
  walletAddress,
  onVote,
  onBack,
}: ProposalDetailProps) {
  const [showAllVotes, setShowAllVotes] = useState(false);

  const totalVotes = useMemo(
    () =>
      proposal
        ? Number(proposal.votesFor) + Number(proposal.votesAgainst) + Number(proposal.votesAbstain)
        : 0,
    [proposal]
  );

  const forPercentage = useMemo(
    () => (totalVotes > 0 && proposal ? (Number(proposal.votesFor) / totalVotes) * 100 : 0),
    [proposal, totalVotes]
  );

  const againstPercentage = useMemo(
    () => (totalVotes > 0 && proposal ? (Number(proposal.votesAgainst) / totalVotes) * 100 : 0),
    [proposal, totalVotes]
  );

  const abstainPercentage = useMemo(
    () => (totalVotes > 0 && proposal ? (Number(proposal.votesAbstain) / totalVotes) * 100 : 0),
    [proposal, totalVotes]
  );

  const quorumPercentage = useMemo(
    () => (proposal && Number(proposal.quorum) > 0 ? (totalVotes / Number(proposal.quorum)) * 100 : 0),
    [proposal, totalVotes]
  );

  const userVote = useMemo(
    () => (proposal ? userVotes.find((v) => v.proposalId === proposal.id) : undefined),
    [userVotes, proposal]
  );

  const hasVoted = !!userVote;
  const canVote = proposal?.status === "active" && walletAddress && !hasVoted;

  const displayedVotes = showAllVotes ? votes : votes.slice(0, 5);

  if (isLoading || !proposal) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const remaining = timeRemaining(proposal.endsAt, proposal.status);

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to proposals list"
          className="mb-3 inline-flex items-center gap-1 text-sm text-text-muted transition hover:text-axion-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to proposals
        </button>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-text-primary">{proposal.title}</h2>
          <Badge variant={statusToBadgeVariant(proposal.status)} className="shrink-0">
            {statusLabel(proposal.status)}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          <span>ID: {proposal.id}</span>
          <span>•</span>
          <span>Proposer: {shortenAddress(proposal.proposer, 6)}</span>
          <span>•</span>
          <span>Created: {new Date(proposal.createdAt).toLocaleDateString()}</span>
          {remaining && (
            <>
              <span>•</span>
              <span className="text-axion-400">{remaining}</span>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border-primary bg-background-primary p-5">
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Description</h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
          {proposal.description}
        </p>
      </div>

      <div className="rounded-xl border border-border-primary bg-background-primary p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Voting Results</h3>

        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-emerald-400 font-medium">For</span>
              <span className="text-text-secondary">{forPercentage.toFixed(1)}% ({formatAmount(proposal.votesFor)})</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-background-secondary">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${forPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-rose-400 font-medium">Against</span>
              <span className="text-text-secondary">{againstPercentage.toFixed(1)}% ({formatAmount(proposal.votesAgainst)})</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-background-secondary">
              <div
                className="h-full rounded-full bg-rose-500 transition-all"
                style={{ width: `${againstPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-amber-400 font-medium">Abstain</span>
              <span className="text-text-secondary">{abstainPercentage.toFixed(1)}% ({formatAmount(proposal.votesAbstain)})</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-background-secondary">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${abstainPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-primary pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-text-muted">Total Votes</p>
            <p className="text-sm font-semibold text-text-primary">{formatAmount(String(totalVotes))}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Quorum</p>
            <p className="text-sm font-semibold text-text-primary">{formatAmount(proposal.quorum)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Quorum Reached</p>
            <p className={`text-sm font-semibold ${quorumPercentage >= 100 ? "text-emerald-400" : "text-text-primary"}`}>
              {quorumPercentage.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Threshold</p>
            <p className="text-sm font-semibold text-text-primary">{proposal.threshold}%</p>
          </div>
        </div>
      </div>

      {proposal.status === "active" && (
        <div className="rounded-xl border border-border-primary bg-background-primary p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Cast Your Vote</h3>

          {!walletAddress ? (
            <p className="text-sm text-text-muted">Connect a wallet to vote on this proposal.</p>
          ) : hasVoted ? (
            <div className="rounded-lg bg-background-secondary/50 p-3 text-sm text-text-secondary">
              You have already voted{" "}
              <span
                className={`font-semibold ${
                  userVote.choice === "for"
                    ? "text-emerald-400"
                    : userVote.choice === "against"
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                {userVote.choice}
              </span>{" "}
              with {formatAmount(userVote.weight)} voting weight.
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="md"
                onClick={() => onVote("for")}
                disabled={isSubmitting}
                loading={isSubmitting && voteStatus === "pending"}
                loadingLabel="Casting vote for"
                aria-label="Vote for this proposal"
                className="border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40 focus-visible:ring-emerald-500"
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              >
                Vote For
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => onVote("against")}
                disabled={isSubmitting}
                loading={isSubmitting && voteStatus === "pending"}
                loadingLabel="Casting vote against"
                aria-label="Vote against this proposal"
                className="border-rose-500/30 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 focus-visible:ring-rose-500"
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              >
                Vote Against
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => onVote("abstain")}
                disabled={isSubmitting}
                loading={isSubmitting && voteStatus === "pending"}
                loadingLabel="Casting abstain vote"
                aria-label="Abstain from voting on this proposal"
                className="border-amber-500/30 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40 focus-visible:ring-amber-500"
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                }
              >
                Abstain
              </Button>
            </div>
          )}

          <div aria-live="polite" aria-atomic="true">
            {voteStatus === "success" && (
              <Alert variant="success" className="mt-2">Your vote has been recorded successfully.</Alert>
            )}
            {voteStatus === "error" && voteError && (
              <Alert variant="error" className="mt-2">{voteError}</Alert>
            )}
          </div>
        </div>
      )}

      {votes.length > 0 && (
        <div className="rounded-xl border border-border-primary bg-background-primary p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Vote History</h3>
          <div className="space-y-2">
            {displayedVotes.map((vote, idx) => (
              <div
                key={`${vote.voter}-${idx}`}
                className="flex items-center justify-between rounded-lg bg-background-secondary/30 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      vote.choice === "for"
                        ? "bg-emerald-950/50 text-emerald-400"
                        : vote.choice === "against"
                        ? "bg-rose-950/50 text-rose-400"
                        : "bg-amber-950/50 text-amber-400"
                    }`}
                  >
                    {vote.choice === "for" ? "Y" : vote.choice === "against" ? "N" : "A"}
                  </span>
                  <span className="text-sm text-text-secondary">{shortenAddress(vote.voter, 6)}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">{formatAmount(vote.weight)}</p>
                  <p className="text-xs text-text-muted">{new Date(vote.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
          {votes.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllVotes((v) => !v)}
              aria-expanded={showAllVotes}
              aria-label={showAllVotes ? "Show fewer votes" : `Show all ${votes.length} votes`}
              className="mt-3 text-axion-400 hover:text-axion-300"
            >
              {showAllVotes ? "Show less" : `Show all ${votes.length} votes`}
            </Button>
          )}
        </div>
      )}

      {proposal.actions.length > 0 && (
        <div className="rounded-xl border border-border-primary bg-background-primary p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Proposal Actions</h3>
          <div className="space-y-2">
            {proposal.actions.map((action, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-background-secondary/30 px-3 py-2 text-sm text-text-secondary"
              >
                <span className="font-medium text-text-primary">{action.type.replace("_", " ").toUpperCase()}</span>
                {" → "}
                <span className="text-text-muted">{action.target}</span>
                {action.value !== "0" && (
                  <span className="text-text-muted"> (value: {formatAmount(action.value)})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}