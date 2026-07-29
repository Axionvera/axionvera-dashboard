import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import {
  createAxionveraGovernanceSdk,
  type AxionveraGovernanceSdk,
  type Proposal,
  type Vote,
  type GovernanceStats,
  type GovernanceParams,
  type VoteChoice,
} from "@/utils/contractHelpersGovernance";
import { NETWORK } from "@/utils/networkConfig";
import { notify } from "@/utils/notifications";

type GovernanceActionType = "vote" | "createProposal";

type GovernanceActionState = {
  status: "idle" | "pending" | "success" | "error";
  hash: string | null;
  error: string | null;
};

type GovernanceState = {
  proposals: Proposal[];
  selectedProposal: Proposal | null;
  votes: Vote[];
  userVotes: Vote[];
  stats: GovernanceStats | null;
  params: GovernanceParams | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  actions: Record<GovernanceActionType, GovernanceActionState>;
};

type GovernanceContextType = GovernanceState & {
  voteStatus: GovernanceActionState["status"];
  voteHash: string | null;
  voteError: string | null;
  createProposalStatus: GovernanceActionState["status"];
  createProposalHash: string | null;
  createProposalError: string | null;
  refresh: () => Promise<void>;
  refreshProposal: (proposalId: string) => Promise<void>;
  vote: (proposalId: string, choice: VoteChoice) => Promise<void>;
  createProposal: (title: string, description: string) => Promise<void>;
  selectProposal: (proposal: Proposal | null) => void;
};

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined);

const INITIAL_ACTION: GovernanceActionState = { status: "idle", hash: null, error: null };
const INITIAL_STATE: GovernanceState = {
  proposals: [],
  selectedProposal: null,
  votes: [],
  userVotes: [],
  stats: null,
  params: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  actions: { vote: { ...INITIAL_ACTION }, createProposal: { ...INITIAL_ACTION } },
};

function getError(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

function updateAction(
  state: GovernanceState,
  type: GovernanceActionType,
  patch: Partial<GovernanceActionState>
): GovernanceState {
  return { ...state, actions: { ...state.actions, [type]: { ...state.actions[type], ...patch } } };
}

type GovernanceProviderProps = { children: ReactNode; walletAddress: string | null; sdk?: AxionveraGovernanceSdk };

export function GovernanceProvider({ children, walletAddress, sdk: providedSdk }: GovernanceProviderProps) {
  const sdk = useMemo(() => providedSdk ?? createAxionveraGovernanceSdk(), [providedSdk]);
  const [state, setState] = useState<GovernanceState>(INITIAL_STATE);
  const walletRef = useRef(walletAddress);
  walletRef.current = walletAddress;

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [proposals, stats, params] = await Promise.all([
        sdk.getProposals({ network: NETWORK }),
        sdk.getGovernanceStats({ network: NETWORK }),
        sdk.getGovernanceParams({ network: NETWORK }),
      ]);
      setState((s) => ({ ...s, proposals, stats, params, isLoading: false }));
    } catch (e) {
      const message = getError(e, "Failed to load governance state.");
      notify.error("Governance Update Failed", message);
      setState((s) => ({ ...s, isLoading: false, error: message }));
    }
  }, [sdk]);

  const refreshProposal = useCallback(async (proposalId: string) => {
    try {
      const [proposal, votes, userVotes] = await Promise.all([
        sdk.getProposal({ proposalId, network: NETWORK }),
        sdk.getVotes({ proposalId, network: NETWORK }),
        walletRef.current
          ? sdk.getUserVotes({ walletAddress: walletRef.current, network: NETWORK })
          : Promise.resolve([]),
      ]);
      setState((s) => ({
        ...s,
        selectedProposal: proposal,
        votes: votes,
        userVotes: userVotes,
      }));
    } catch (e) {
      const message = getError(e, "Failed to load proposal details.");
      notify.error("Proposal Load Failed", message);
    }
  }, [sdk]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const vote = useCallback(async (proposalId: string, choice: VoteChoice) => {
    if (!walletRef.current) {
      setState((s) => updateAction(s, "vote", { status: "error", error: "Connect a wallet to vote.", hash: null }));
      return;
    }

    setState((s) => ({
      ...updateAction(s, "vote", { status: "pending", hash: null, error: null }),
      isSubmitting: true,
      error: null,
    }));

    try {
      const result = await sdk.vote({
        walletAddress: walletRef.current,
        proposalId,
        choice,
        network: NETWORK,
      });
      await refresh();
      await refreshProposal(proposalId);
      setState((s) =>
        updateAction(s, "vote", { status: "success", hash: result.hash, error: null })
      );
      notify.success("Vote Cast", `Transaction hash: ${result.hash}`);
    } catch (e) {
      const message = getError(e, "Vote failed.");
      notify.error("Vote Failed", message);
      setState((s) =>
        updateAction(s, "vote", { status: "error", hash: null, error: message })
      );
    } finally {
      setState((s) => ({ ...s, isSubmitting: false }));
    }
  }, [sdk, refresh, refreshProposal]);

  const createProposal = useCallback(async (title: string, description: string) => {
    if (!walletRef.current) {
      setState((s) => updateAction(s, "createProposal", { status: "error", error: "Connect a wallet to create a proposal.", hash: null }));
      return;
    }
    if (!title.trim() || !description.trim()) {
      setState((s) => updateAction(s, "createProposal", { status: "error", error: "Title and description are required.", hash: null }));
      return;
    }

    setState((s) => ({
      ...updateAction(s, "createProposal", { status: "pending", hash: null, error: null }),
      isSubmitting: true,
      error: null,
    }));

    try {
      const result = await sdk.createProposal({
        walletAddress: walletRef.current,
        title: title.trim(),
        description: description.trim(),
        actions: [{ type: "custom", target: "governance", value: "0", data: "proposal_action" }],
        network: NETWORK,
      });
      await refresh();
      setState((s) =>
        updateAction(s, "createProposal", { status: "success", hash: result.hash, error: null })
      );
      notify.success("Proposal Created", `Proposal ID: ${result.proposalId}`);
    } catch (e) {
      const message = getError(e, "Failed to create proposal.");
      notify.error("Proposal Creation Failed", message);
      setState((s) =>
        updateAction(s, "createProposal", { status: "error", hash: null, error: message })
      );
    } finally {
      setState((s) => ({ ...s, isSubmitting: false }));
    }
  }, [sdk, refresh]);

  const selectProposal = useCallback((proposal: Proposal | null) => {
    setState((s) => ({ ...s, selectedProposal: proposal, votes: [], userVotes: [] }));
    if (proposal) {
      void refreshProposal(proposal.id);
    }
  }, [refreshProposal]);

  const value = useMemo(
    () => ({
      ...state,
      voteStatus: state.actions.vote.status,
      voteHash: state.actions.vote.hash,
      voteError: state.actions.vote.error,
      createProposalStatus: state.actions.createProposal.status,
      createProposalHash: state.actions.createProposal.hash,
      createProposalError: state.actions.createProposal.error,
      refresh,
      refreshProposal,
      vote,
      createProposal,
      selectProposal,
    }),
    [state, refresh, refreshProposal, vote, createProposal, selectProposal]
  );

  return <GovernanceContext.Provider value={value}>{children}</GovernanceContext.Provider>;
}

export function useGovernanceContext() {
  const ctx = useContext(GovernanceContext);
  if (!ctx) throw new Error("useGovernanceContext must be used within a GovernanceProvider");
  return ctx;
}

export const useGovernance = useGovernanceContext;