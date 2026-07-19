import { useRouter } from "next/router";
import Head from "next/head";

import {
  MemoizedBalanceCard,
  MemoizedDepositForm,
  MemoizedWithdrawForm,
  MemoizedTransactionHistory,
  MemoizedAnalyticsDashboard
} from "@/components/optimized";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useEffect, useMemo, useState } from "react";
import { useVaultContext } from "@/contexts/VaultContext";
import { useWalletContext } from "@/hooks/useWallet";
import { RenderBoundary } from "@/rendering";
import { DashboardLayoutManager, DashboardWidgetCard } from "@/components/layout";
import { DashboardPlacement } from "@/layout/types";

export default function DashboardPage() {
  const wallet = useWalletContext();
  const router = useRouter();
  const vault = useVaultContext();

  const [mounted, setMounted] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const widgetIds = useMemo(() => ["balance", "deposit", "analytics"], []);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to landing page if the wallet is disconnected while on a protected route
  useEffect(() => {
    if (mounted && !wallet.isConnected && !wallet.isConnecting) {
      router.replace('/');
    }
  }, [mounted, wallet.isConnected, wallet.isConnecting, router]);

  return (
    <>
      <Head>
        <title>Dashboard · Axionvera</title>
      </Head>
      <main className="min-h-screen bg-background-primary text-text-primary transition-colors duration-200">
        <Sidebar />
        <div className="flex-1 lg:pl-64 w-full transition-all">
          <Navbar
            publicKey={wallet.publicKey}
            isConnecting={wallet.isConnecting}
            walletType={wallet.walletType}
            availableWallets={wallet.availableWallets}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
            onSwitch={wallet.switchWallet}
          />
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 w-full space-y-6">
            <DashboardLayoutManager widgetIds={widgetIds}>
              {({ placements, activeBreakpoint, onReorder, onResize }) => (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  {placements.map((placement) => {
                    const widgetContent = (() => {
                      switch (placement.id) {
                        case "balance":
                          return (
                            <RenderBoundary
                              name="balance-section"
                              dependencies={[wallet.isConnected, wallet.publicKey, vault.balance, vault.rewards, vault.isLoading, vault.error]}
                            >
                              <MemoizedBalanceCard
                                isConnected={wallet.isConnected}
                                publicKey={wallet.publicKey}
                                balance={vault.balance}
                                rewards={vault.rewards}
                                isLoading={vault.isLoading}
                                error={vault.error}
                                onRefresh={vault.refresh}
                              />
                            </RenderBoundary>
                          );
                        case "deposit":
                          return (
                            <RenderBoundary
                              name="deposit-section"
                              dependencies={[wallet.isConnected, vault.isSubmitting, vault.depositStatus, wallet.balance, wallet.publicKey, vault.lastDepositAmount, vault.depositError, vault.depositHash]}
                            >
                              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                                <MemoizedDepositForm
                                  isConnected={wallet.isConnected}
                                  isSubmitting={vault.isSubmitting}
                                  onDeposit={vault.deposit}
                                  status={vault.depositStatus}
                                  walletBalance={wallet.balance ? parseFloat(wallet.balance) : null}
                                  walletAddress={wallet.publicKey}
                                  statusMessage={
                                    vault.depositStatus === "pending"
                                      ? `Depositing ${vault.lastDepositAmount ?? "0"} tokens into the vault.`
                                      : vault.depositStatus === "success"
                                        ? `Successfully deposited ${vault.lastDepositAmount ?? "0"} tokens.`
                                        : vault.depositStatus === "error"
                                          ? vault.depositError
                                          : null
                                  }
                                  transactionHash={vault.depositHash}
                                />
                                <MemoizedWithdrawForm
                                  isConnected={wallet.isConnected}
                                  isSubmitting={vault.isSubmitting}
                                  balance={vault.balance}
                                  onWithdraw={vault.withdraw}
                                  status={vault.withdrawStatus}
                                  statusMessage={
                                    vault.withdrawStatus === "pending"
                                      ? `Withdrawing ${vault.lastWithdrawAmount ?? "0"} tokens from the vault.`
                                      : vault.withdrawStatus === "success"
                                        ? `Successfully withdrew ${vault.lastWithdrawAmount ?? "0"} tokens.`
                                        : vault.withdrawStatus === "error"
                                          ? vault.withdrawError
                                          : null
                                  }
                                  transactionHash={vault.withdrawHash}
                                  walletAddress={wallet.publicKey}
                                />
                              </div>
                            </RenderBoundary>
                          );
                        case "analytics":
                          return (
                            <div className="space-y-6">
                              <RenderBoundary
                                name="analytics-section"
                                dependencies={[wallet.isConnected, wallet.publicKey, vault.transactions]}
                              >
                                <MemoizedAnalyticsDashboard />
                              </RenderBoundary>
                              <RenderBoundary
                                name="transactions-section"
                                dependencies={[wallet.isConnected, wallet.publicKey, vault.isLoading, vault.transactions, vault.isClaiming]}
                              >
                                <MemoizedTransactionHistory
                                  isConnected={wallet.isConnected}
                                  publicKey={wallet.publicKey}
                                  isLoading={vault.isLoading}
                                  transactions={vault.transactions}
                                  onClaimRewards={vault.claimRewards}
                                  isClaiming={vault.isClaiming}
                                />
                              </RenderBoundary>
                            </div>
                          );
                        default:
                          return null;
                      }
                    })();

                    const titleMap: Record<string, string> = {
                      balance: "Balance",
                      deposit: "Vault Actions",
                      analytics: "Protocol Insights",
                    };

                    const descriptionMap: Record<string, string> = {
                      balance: "Key balance, rewards, and refresh controls.",
                      deposit: "Deposit and withdraw actions in one place.",
                      analytics: "Analytics and history for the active vault.",
                    };

                    return (
                      <DashboardWidgetCard
                        key={placement.id}
                        widgetId={placement.id}
                        title={titleMap[placement.id] ?? placement.id}
                        description={descriptionMap[placement.id]}
                        placement={placement}
                        isDragging={draggedWidgetId === placement.id}
                        onDragStart={() => setDraggedWidgetId(placement.id)}
                        onDrop={() => {
                          if (draggedWidgetId && draggedWidgetId !== placement.id) {
                            onReorder(draggedWidgetId, placement.id);
                          }
                          setDraggedWidgetId(null);
                        }}
                        onResize={(width) => onResize(placement.id, width)}
                      >
                        {widgetContent}
                      </DashboardWidgetCard>
                    );
                  })}
                </div>
              )}
            </DashboardLayoutManager>
          </div>
        </div>
      </main>
    </>
  );
}
