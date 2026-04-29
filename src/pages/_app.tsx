import type { AppProps } from "next/app";
import { Toaster } from 'sonner';

import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import ThemeToggle from "@/components/ThemeToggle";
import { inter, jetbrainsMono } from "@/lib/fonts";

import { useEffect } from "react";
import { initTelemetry } from "@/utils/telemetry";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    initTelemetry();
  }, []);

  return (
    // Apply CSS-variable font classes to the root so the custom properties
    // (--font-inter, --font-mono) are available globally via Tailwind's
    // fontFamily tokens and any CSS that references them directly.
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <ErrorBoundary>
        <ThemeProvider>
          <WalletProvider>
            <Component {...pageProps} />
            <ThemeToggle />
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
          </WalletProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}
