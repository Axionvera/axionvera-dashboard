import { useRouter } from "next/router";
import Head from "next/head";

import BalanceCard from "@/components/BalanceCard";
import DepositForm from "@/components/DepositForm";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import TransactionHistory from "@/components/TransactionHistory";
import WithdrawForm from "@/components/WithdrawForm";
import { useEffect } from "react";
import { useVault } from "@/hooks/useVault";
import { useWalletContext } from "@/hooks/useWallet";

export default function DashboardPage() {
  // TODO: add analytics dashboard
  // TODO: add wallet options
  // TODO: add governance interface

  const wallet = useWalletContext();
  const router = useRouter();
  const vault = useVault({ walletAddress: wallet.publicKey });

  // Redirect to landing page if the wallet is disconnected while on a protected route
  useEffect(() => {
    if (!wallet.isConnected && !wallet.isConnecting) {
      router.replace('/');
    }
  }, [wallet.isConnected, wallet.isConnecting, router]);

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
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 w-full">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <div className="col-span-1 lg:col-span-1 w-full">
                <BalanceCard
                  isConnected={wallet.isConnected}
                  publicKey={wallet.publicKey}
                  balance={vault.balance}
                  rewards={vault.rewards}
                  isLoading={vault.isLoading}
                  error={vault.error}
                  onRefresh={vault.refresh}
                />
              </div>
              <div className="col-span-1 lg:col-span-2 w-full">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  <DepositForm
                    isConnected={wallet.isConnected}
                    isSubmitting={vault.isSubmitting}
                    onDeposit={vault.deposit}
                    status={vault.depositStatus}
                    walletBalance={wallet.balance ? parseFloat(wallet.balance) : null}

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
                  <WithdrawForm
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
                  />
                </div>
                <div className="mt-6 w-full overflow-x-auto">
                  <TransactionHistory
                    isConnected={wallet.isConnected}
                    publicKey={wallet.publicKey}
                    isLoading={vault.isLoading}
                    transactions={vault.transactions}
                    onClaimRewards={vault.claimRewards}
                    isClaiming={vault.isClaiming}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
