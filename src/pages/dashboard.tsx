import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useVaultContext } from "@/contexts/VaultContext";
import { useWalletContext } from "@/hooks/useWallet";
import { useWidgetLoading } from "@/hooks/useWidgetLoading";
import { widgetRegistry } from "@/widgets/registry";
import { RenderBoundary } from "@/rendering";
import { DashboardLayoutManager, DashboardWidgetCard } from "@/components/layout";

export default function DashboardPage() {
  const wallet = useWalletContext();
  const router = useRouter();
  const vault = useVaultContext();

  const [mounted, setMounted] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);

  const widgets = useSyncExternalStore(
    widgetRegistry.subscribe.bind(widgetRegistry),
    () => widgetRegistry.getWidgets(),
    () => widgetRegistry.getWidgets(),
  );
  const widgetIds = useMemo(() => widgets.map((widget) => widget.id), [widgets]);
  const { isLoading: widgetsLoading, error: widgetsError } = useWidgetLoading();

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
            {widgetsLoading ? (
              <div className="rounded-2xl border border-border-primary bg-background-secondary/30 p-6 text-sm text-text-muted">
                Loading dashboard widgets...
              </div>
            ) : widgetsError ? (
              <div className="rounded-2xl border border-red-500 bg-red-500/10 p-6 text-sm text-red-600">
                {widgetsError}
              </div>
            ) : (
              <DashboardLayoutManager
                widgetIds={widgetIds}
                children={({ placements, activeBreakpoint, onReorder, onResize }) => (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                    {placements.map((placement) => {
                      const widget = widgetRegistry.getWidget(placement.id);
                      const WidgetComponent = widget?.component;
                      const widgetTitle = widget?.metadata?.title ?? placement.id;
                      const widgetDescription = widget?.metadata?.description;
                      const widgetConfig = widget?.config ?? {};
                      const widgetContent = WidgetComponent ? (
                        <RenderBoundary name={`widget-${placement.id}`}>
                          <Suspense
                            fallback={
                              <div className="rounded-xl border border-border-primary bg-background-secondary/30 p-4 text-sm text-text-muted">
                                Loading {widgetTitle}...
                              </div>
                            }
                          >
                            <WidgetComponent {...(widgetConfig as Record<string, unknown>)} />
                          </Suspense>
                        </RenderBoundary>
                      ) : (
                        <div className="rounded-xl border border-border-primary bg-background-secondary/30 p-4 text-sm text-text-muted">
                          Widget {placement.id} has not been registered yet.
                        </div>
                      );

                      return (
                        <DashboardWidgetCard
                          key={placement.id}
                          widgetId={placement.id}
                          title={widgetTitle}
                          description={widgetDescription}
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
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
