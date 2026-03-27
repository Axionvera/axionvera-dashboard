import type { AppProps } from "next/app";

import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
