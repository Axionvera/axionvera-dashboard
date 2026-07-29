import { useRouter } from "next/router";
import { useVault } from "@/hooks/useVault";
import { useWalletContext } from "@/hooks/useWallet";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import AnalyticsMetrics from "@/components/AnalyticsMetrics";
import BalanceTrendChart from "@/components/BalanceTrendChart";
import { StatisticsSkeleton } from "@/components/Skeletons";
import { useEffect } from "react";

export default function AnalyticsPage() {
  const wallet = useWalletContext();
  const router = useRouter();
  const { analytics, analyticsLoading: isLoading, analyticsError: error, refreshAnalytics: refresh } = useVault();

  useEffect(() => {
    if (!wallet.isConnected && !wallet.isConnecting) {
      router.replace("/");
    }
  }, [wallet.isConnected, wallet.isConnecting, router]);

  return (
    <>
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
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 w-full">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Portfolio Analytics
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              Track your vault performance and historical trends
            </p>

            {isLoading ? (
              <div className="space-y-6">
                <StatisticsSkeleton />
                <div className="h-80 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
              </div>
            ) : error ? (
              <div className="p-8 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
                <p className="text-red-600 dark:text-red-300 text-center">{error}</p>
                <button
                  onClick={() => refresh()}
                  className="mt-4 w-full max-w-xs mx-auto block bg-red-600 text-white px-4 py-2 rounded-xl"
                >
                  Try Again
                </button>
              </div>
            ) : analytics ? (
              <>
                <AnalyticsMetrics
                  rewardPerformance={analytics.rewardPerformance}
                  participationMetrics={analytics.participationMetrics}
                />
                <div className="mt-8">
                  <BalanceTrendChart data={analytics.historicalBalances} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
