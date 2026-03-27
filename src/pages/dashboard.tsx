import Head from "next/head";

import BalanceCard from "@/components/BalanceCard";
import DepositForm from "@/components/DepositForm";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import TransactionHistory from "@/components/TransactionHistory";
import WithdrawForm from "@/components/WithdrawForm";
import { useVault } from "@/hooks/useVault";
import { useWallet } from "@/hooks/useWallet";

export default function DashboardPage() {
  // TODO: add dark mode
  // TODO: add analytics dashboard
  // TODO: improve mobile responsiveness
  // TODO: add wallet options
  // TODO: add governance interface

  const wallet = useWallet();
  const vault = useVault({ walletAddress: wallet.address });

  return (
    <>
      <Head>
        <title>Dashboard · Axionvera</title>
      </Head>
      <main className="min-h-screen bg-background-primary">
        <Sidebar />
        <div className="lg:pl-64">
          <Navbar
            address={wallet.address}
            isConnecting={wallet.isConnecting}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <BalanceCard
                  isConnected={wallet.isConnected}
                  address={wallet.address}
                  balance={vault.balance}
                  rewards={vault.rewards}
                  isLoading={vault.isLoading}
                  error={vault.error}
                  onRefresh={vault.refresh}
                />
              </div>
              <div className="lg:col-span-2">
                <div className="grid gap-6 md:grid-cols-2">
                  <DepositForm
                    isConnected={wallet.isConnected}
                    isSubmitting={vault.isSubmitting}
                    onDeposit={vault.deposit}
                  />
                  <WithdrawForm
                    isConnected={wallet.isConnected}
                    isSubmitting={vault.isSubmitting}
                    onWithdraw={vault.withdraw}
                  />
                </div>
                <div className="mt-6">
                  <TransactionHistory
                    isConnected={wallet.isConnected}
                    address={wallet.address}
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
