import type { AppProps } from 'next/app';
import { Toaster } from 'sonner';

import '@/styles/globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';
import { WalletProvider } from '@/contexts/WalletContext';
import ThemeToggle from '@/components/ThemeToggle';
import { inter, jetbrainsMono } from '@/lib/fonts';

import { useEffect } from 'react';
import { initTelemetry } from '@/utils/telemetry';
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { ThemeProvider as NextThemeProvider } from "next-themes";

import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider as AppThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { QueryProvider } from "@/contexts/QueryContext";
import ThemeToggle from "@/components/ThemeToggle";
import { inter, jetbrainsMono } from "@/lib/fonts";

import { useEffect } from "react";
import { initTelemetry } from "@/utils/telemetry";
import { ThemeProvider } from '@/contexts/ThemeContext';

/**
 * Web Vitals callback - sends metrics to the telemetry server
 * Monitors LCP (Largest Contentful Paint), FID (First Input Delay), CLS, etc.
 */
function onWebVitals(metric: any) {
  // Send to existing telemetry infrastructure
  console.debug('Web Vitals metric:', metric.name, metric.value);
  
  // Optionally send to analytics service
  if (typeof window !== 'undefined') {
    // Google Analytics 4 example (uncomment if using GA4):
    // gtag('event', metric.name, {
    //   event_category: 'Web Vitals',
    //   event_label: metric.id,
    //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //   non_interaction: true,
    // });
  }
}

// Import the correct ThemeProvider - choose one based on your needs
// Option 1: If you want to use next-themes for theme switching
// Option 2: If you want to use your custom ThemeContext

// For this fix, I'll assume you want to use both:
// - next-themes for the main theme management
// - Your custom ThemeContext for additional theme logic

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AppThemeProvider>
        {children}
      </AppThemeProvider>
    </NextThemeProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    initTelemetry();
  }, []);

  // Report Web Vitals metrics for performance monitoring
  // This enables LCP, FID, CLS, TTFB, and other Core Web Vitals tracking
  useEffect(() => {
    reportWebVitals(onWebVitals);
  }, []);

  return (
    // Apply CSS-variable font classes to the root so the custom properties
    // (--font-inter, --font-mono) are available globally via Tailwind's
    // fontFamily tokens and any CSS that references them directly.
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <ErrorBoundary>
        <AppThemeProvider>
          <WalletProvider>
            <Component {...pageProps} />
            <ThemeToggle />
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
            <Toaster position="top-right" richColors closeButton duration={4000} />
          </WalletProvider>
        </AppThemeProvider>
      </ErrorBoundary>
    </div>
  );
}