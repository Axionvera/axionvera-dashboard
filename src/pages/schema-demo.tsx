import Head from "next/head";

import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { DashboardSchemaRenderer } from "@/components/schema/DashboardSchemaRenderer";
import { protocolDashboardSchema } from "@/schema/examples";
import { useWalletContext } from "@/hooks/useWallet";

export default function SchemaDemoPage() {
  const wallet = useWalletContext();

  return (
    <>
      <Head>
        <title>Schema Demo · Axionvera</title>
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
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-8 w-full">
            <DashboardSchemaRenderer schema={protocolDashboardSchema} />
          </div>
        </div>
      </main>
    </>
  );
}
