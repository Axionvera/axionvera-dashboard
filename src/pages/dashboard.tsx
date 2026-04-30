import dynamic from "next/dynamic";
import Head from "next/head";

import BalanceCard from "@/components/BalanceCard";
import ClaimRewardsCard from "@/components/ClaimRewardsCard";
import DepositForm from "@/components/DepositForm";
import Navbar from "@/components/Navbar";
import NetworkMismatchBanner from "@/components/NetworkMismatchBanner";
import Sidebar from "@/components/Sidebar";
import { TransactionSkeleton, ChartSkeleton } from "@/components/Skeletons";
import WithdrawForm from "@/components/WithdrawForm";
import { useWalletAssetBalance } from "@/hooks/useWalletAssetBalance";
import { useVault } from "@/hooks/useVault";
import { useWalletContext } from "@/hooks/useWallet";
import { findVaultAsset, getVaultAssets } from "@/utils/vaultAssets";
import { useEffect, useMemo, useState } from "react";

const TransactionHistory = dynamic(
  () => import("@/components/TransactionHistory"),
  {
    loading: () => <TransactionSkeleton />,
    ssr: false,
  }
);

const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export default function DashboardPage() {
  const wallet = useWalletContext();
  const assets = useMemo(() => getVaultAssets(), []);
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id ?? "native-xlm");

  useEffect(() => {
    if (!assets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(assets[0]?.id ?? "native-xlm");
    }
  }, [assets, selectedAssetId]);

  const selectedAsset = useMemo(() => findVaultAsset(selectedAssetId), [selectedAssetId]);
  const walletAssetBalance = useWalletAssetBalance({
    walletAddress: wallet.publicKey,
    network: wallet.network,
    asset: selectedAsset,
  });
  const vault = useVault({ walletAddress: wallet.publicKey, asset: selectedAsset });

  // URL query parameter state
  const [activeTab, setActiveTab] = useState<TabType>("deposit");
  const [prefilledAmount, setPrefilledAmount] = useState<string>("");

  // Handle URL query parameters
  useEffect(() => {
    const action = searchParams.get("action");
    const amount = searchParams.get("amount");

    // Set the active tab based on action parameter
    if (action === "deposit") {
      setActiveTab("deposit");
    } else if (action === "withdraw") {
      setActiveTab("withdraw");
    }

    // Pre-fill the amount if provided
    if (amount) {
      setPrefilledAmount(amount);
    }
  }, [searchParams]);

  // Auto-trigger wallet connection if not connected and action is present
  useEffect(() => {
    const action = searchParams.get("action");
    if (action && !wallet.isConnected && !wallet.isConnecting) {
      wallet.connect();
    }
  }, [searchParams, wallet.isConnected, wallet.isConnecting, wallet.connect]);

  return (
    <>
      <Head>
        <title>Dashboard · AxionVera</title>
        <meta
          name="description"
          content="View your AxionVera vault balances, deposit and withdraw tokens, and track your DeFi transaction history on Stellar."
        />

        {/* Open Graph */}
        <meta property="og:title" content="Dashboard · AxionVera" />
        <meta
          property="og:description"
          content="View your AxionVera vault balances, deposit and withdraw tokens, and track your DeFi transaction history."
        />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Dashboard · AxionVera" />
        <meta
          name="twitter:description"
          content="View your AxionVera vault balances, deposit and withdraw tokens, and track your DeFi transaction history."
        />
      </Head>
      <main className="min-h-screen bg-background-primary text-text-primary transition-colors duration-200">
        <Sidebar />
        <div className="flex-1 w-full transition-all lg:pl-64">
          <Navbar
            publicKey={wallet.publicKey}
            isConnecting={wallet.isConnecting}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="col-span-1 w-full lg:col-span-1">
                <BalanceCard
                  isConnected={wallet.isConnected}
                  publicKey={wallet.publicKey}
                  balance={vault.balance}
                  rewards={vault.rewards}
                  assetSymbol={selectedAsset.symbol}
                  isLoading={vault.isLoading}
                  error={vault.error}
                  onRefresh={vault.refresh}
                />
                <ClaimRewardsCard
                  isConnected={wallet.isConnected}
                  rewards={vault.rewards}
                  isLoading={vault.isLoading}
                  isClaiming={vault.isClaiming}
                  error={vault.error}
                  onClaim={vault.claimRewards}
                />
              </div>
              <div className="col-span-1 w-full lg:col-span-2">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <DepositForm
                    isConnected={wallet.isConnected}
                    isSubmitting={vault.isSubmitting}
                    isLoading={vault.isLoading}
                    onDeposit={vault.deposit}
                    status={vault.depositStatus}
                    walletBalance={walletAssetBalance.balance}
                    selectedAsset={selectedAsset}
                    assets={assets}
                    onAssetChange={setSelectedAssetId}
                    statusMessage={
                      vault.depositStatus === "pending"
                        ? `Depositing ${vault.lastDepositAmount ?? "0"} ${selectedAsset.symbol} into the vault.`
                        : vault.depositStatus === "success"
                          ? `Successfully deposited ${vault.lastDepositAmount ?? "0"} ${selectedAsset.symbol}.`
                          : vault.depositStatus === "error"
                            ? vault.depositError
                            : null
                    }
                    transactionHash={vault.depositHash}
                    defaultAmount={activeTab === "deposit" ? prefilledAmount : ""}
                  />
                  <WithdrawForm
                    isConnected={wallet.isConnected}
                    isSubmitting={vault.isSubmitting}
                    isLoading={vault.isLoading}
                    balance={vault.balance}
                    onWithdraw={vault.withdraw}
                    selectedAsset={selectedAsset}
                    assets={assets}
                    onAssetChange={setSelectedAssetId}
                    status={vault.withdrawStatus}
                    txStep={vault.withdrawTxStep}
                    isNetworkMismatch={wallet.isNetworkMismatch}
                    statusMessage={
                      vault.withdrawStatus === "pending"
                        ? `Withdrawing ${vault.lastWithdrawAmount ?? "0"} ${selectedAsset.symbol} from the vault.`
                        : vault.withdrawStatus === "success"
                          ? `Successfully withdrew ${vault.lastWithdrawAmount ?? "0"} ${selectedAsset.symbol}.`
                          : vault.withdrawStatus === "error"
                            ? vault.withdrawError
                            : null
                    }
                    transactionHash={vault.withdrawHash}
                    defaultAmount={activeTab === "withdraw" ? prefilledAmount : ""}
                  />
                </div>
                <div className="mt-6">
                  <AnalyticsChart />
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

