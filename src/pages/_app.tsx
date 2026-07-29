import type { AppProps } from "next/app";
import { Toaster } from 'sonner';

import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { RBACProvider } from "@/contexts/RBACContext";
import { VaultProvider } from "@/hooks/useVault";
import { useWalletContext } from "@/hooks/useWallet";
import ThemeToggle from "@/components/ThemeToggle";
import { inter, jetbrainsMono } from "@/lib/fonts";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { initTelemetry } from "@/utils/telemetry";
import { emit } from "@/observability/diagnostics";
import { GovernanceProvider } from "@/hooks/useGovernance";
import { OfflineProvider } from "@/pwa/OfflineProvider";
import { WorkspaceProvider } from "@/workspaces";
import { AssetPreloadEngine } from "@/preload";
import { ServiceProvider } from "@/providers";
import { loadBundledExtensions } from "@/core/extensions";


function AppInner(props: AppProps) {
  const router = useRouter();
  const { Component, pageProps } = props;

  useEffect(() => {
    initTelemetry();
    void loadBundledExtensions();
  }, []);

  useEffect(() => {
    const preloader = new AssetPreloadEngine({ router });
    preloader.preloadForRoute(router.pathname);

    let finishNavigationTiming: (() => number) | undefined;
    const handleRouteStart = () => {
      finishNavigationTiming = preloader.trackNavigationStart();
    };
    const handleRouteChange = (url: string) => {
      const preloadLatencyMs = finishNavigationTiming?.();
      finishNavigationTiming = undefined;
      emit('page_view', {
        url,
        preloadLatencyMs,
        preloadMetrics: preloader.getMetrics(),
      });
      preloader.preloadForRoute(url.split('?')[0] || url);
    };

    router.events.on('routeChangeStart', handleRouteStart);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteStart);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    // Apply CSS-variable font classes to the root so the custom properties
    // (--font-inter, --font-mono) are available globally via Tailwind's
    // fontFamily tokens and any CSS that references them directly.
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <ErrorBoundary>
        <ServiceProvider>
          <WorkspaceProvider>
            <ThemeProvider>
              <OfflineProvider>
                <WalletProvider>
                  <RBACProvider>
                    <ProvidersInner Component={Component} pageProps={pageProps} />
                  </RBACProvider>
                </WalletProvider>
                <Toaster />
              </OfflineProvider>
            </ThemeProvider>
          </WorkspaceProvider>
        </ServiceProvider>
      </ErrorBoundary>
    </div>
  );
}

/**
 * Inner wrapper that has access to the WalletContext, so it can pass
 * `walletAddress` down to GovernanceProvider and VaultProvider.
 */
function ProvidersInner({ Component, pageProps }: Pick<AppProps, "Component" | "pageProps">) {
  const wallet = useWalletContext();
  return (
    <GovernanceProvider walletAddress={wallet.publicKey}>
      <VaultProvider walletAddress={wallet.publicKey}>
        <Component {...pageProps} />
      </VaultProvider>
    </GovernanceProvider>
  );
}

export default function App(props: AppProps) {
  return <AppInner {...props} />;
}
