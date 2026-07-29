/**
 * @module features/governance
 *
 * Public API for the governance feature: proposals, voting and stats.
 * The on-chain `Proposal` shape in `@/utils/contractHelpersGovernance` is the
 * single governance domain type.
 */

export { GovernanceProvider, useGovernance } from "@/hooks/useGovernance";
export { createAxionveraGovernanceSdk } from "@/utils/contractHelpersGovernance";
export type {
  Proposal,
  Vote,
  VoteChoice,
  ProposalStatus,
  GovernanceStats,
  GovernanceParams,
  ProposalAction,
  AxionveraGovernanceSdk,
} from "@/utils/contractHelpersGovernance";

export { default as ProposalList } from "./components/ProposalList";
export { default as ProposalDetail } from "./components/ProposalDetail";
export { default as ProposalCard } from "./components/ProposalCard";
export { default as GovernanceStatsPanel } from "./components/GovernanceStats";
export { default as CreateProposalModal } from "./components/CreateProposalModal";
