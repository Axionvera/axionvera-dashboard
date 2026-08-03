import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";

import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import {
  CreateProposalModal,
  GovernanceStatsPanel,
  ProposalDetail,
  ProposalList,
} from "@/features/governance";
import { useWalletContext } from "@/hooks/useWallet";
import { useGovernance } from "@/hooks/useGovernance";

export default function GovernancePage() {
  const wallet = useWalletContext();
  const router = useRouter();
  const governance = useGovernance();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!wallet.isConnected && !wallet.isConnecting) {
      router.replace("/");
    }
  }, [wallet.isConnected, wallet.isConnecting, router]);

  const handleVote = async (choice: "for" | "against" | "abstain") => {
    if (!governance.selectedProposal) return;
    await governance.vote(governance.selectedProposal.id, choice);
  };

  const handleCreateProposal = async (title: string, description: string) => {
    await governance.createProposal(title, description);
    if (governance.createProposalStatus === "success") {
      setIsCreateModalOpen(false);
    }
  };

  return (
    <>
      <Head>
        <title>Governance · Axionvera</title>
      </Head>

      <div className="flex min-h-screen bg-background-primary">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <Navbar
            publicKey={wallet.publicKey}
            isConnecting={wallet.isConnecting}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
            walletType={wallet.walletType}
            availableWallets={wallet.availableWallets}
            onSwitch={wallet.connect}
          />
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Governance</h1>
                  <p className="mt-1 text-sm text-text-secondary">
                    Participate in protocol decisions and vote on proposals
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  disabled={!wallet.isConnected || governance.isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-axion-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-axion-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Proposal
                </button>
              </div>

              <div className="mb-6">
                <GovernanceStatsPanel stats={governance.stats} isLoading={governance.isLoading} />
              </div>

              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <div className="rounded-xl border border-border-primary bg-background-primary p-4 h-[600px]">
                    <h2 className="mb-4 text-sm font-semibold text-text-primary">Proposals</h2>
                    <ProposalList
                      proposals={governance.proposals}
                      userVotes={governance.userVotes}
                      isLoading={governance.isLoading}
                      selectedProposal={governance.selectedProposal}
                      onSelect={governance.selectProposal}
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <div className="rounded-xl border border-border-primary bg-background-primary p-4 min-h-[600px]">
                    <ProposalDetail
                      proposal={governance.selectedProposal}
                      votes={governance.votes}
                      userVotes={governance.userVotes}
                      isLoading={governance.isLoading}
                      isSubmitting={governance.isSubmitting}
                      voteStatus={governance.voteStatus}
                      voteError={governance.voteError}
                      walletAddress={wallet.address}
                      onVote={handleVote}
                      onBack={() => governance.selectProposal(null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <CreateProposalModal
        isOpen={isCreateModalOpen}
        isSubmitting={governance.isSubmitting}
        createProposalStatus={governance.createProposalStatus}
        createProposalError={governance.createProposalError}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProposal}
      />
    </>
  );
}