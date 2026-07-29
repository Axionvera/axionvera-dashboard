import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";

import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { ProtocolHealthDashboard } from "@/features/monitoring";
import { useWalletContext } from "@/hooks/useWallet";

export default function MonitoringPage() {
  const wallet = useWalletContext();
  const router = useRouter();

  useEffect(() => {
    if (!wallet.isConnected && !wallet.isConnecting) {
      router.replace("/");
    }
  }, [wallet.isConnected, wallet.isConnecting, router]);

  return (
    <>
      <Head>
        <title>Protocol Monitoring · Axionvera</title>
      </Head>
      <main className="min-h-screen bg-background-primary text-text-primary transition-colors duration-200">
        <Sidebar />
        <div className="flex-1 w-full transition-all lg:pl-64">
          <Navbar
            publicKey={wallet.publicKey}
            isConnecting={wallet.isConnecting}
            walletType={wallet.walletType}
            availableWallets={wallet.availableWallets}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
            onSwitch={wallet.switchWallet}
          />
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-8">
            <ProtocolHealthDashboard />
          </div>
        </div>
      </main>
    </>
  );
}
