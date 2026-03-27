import type { AppProps } from "next/app";
import { ThemeProvider } from "@/context/ThemeContext";

import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
