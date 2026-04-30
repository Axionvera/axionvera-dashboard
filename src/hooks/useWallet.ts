import { useEffect, useRef, useCallback, useState } from "react";
import { getPublicKey, isConnected } from "@stellar/freighter-api";

export { useWalletContext, useWallet, WalletProvider } from '@/contexts/WalletContext';

export function useWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Your existing connect logic stays as-is
  const connect = useCallback(async () => {
    const key = await getPublicKey();
    setPublicKey(key);
    setConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setConnected(false);
  }, []);

  // --- NEW: Poll Freighter for account/connection changes ---
  useEffect(() => {
    // Only poll if already connected
    if (!connected) return;

    intervalRef.current = setInterval(async () => {
      try {
        const stillConnected = await isConnected();

        // User disconnected from inside the extension
        if (!stillConnected) {
          disconnect();
          return;
        }

        const currentKey = await getPublicKey();

        // Account switched
        if (currentKey !== publicKey) {
          setPublicKey(currentKey);
          // Cache invalidation happens via the publicKey change —
          // any useEffect/useQuery watching publicKey will re-run automatically
        }
      } catch {
        // Extension removed or errored — treat as disconnected
        disconnect();
      }
    }, 1000); // poll every 1 second

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [connected, publicKey, disconnect]);
  // ----------------------------------------------------------

  return { publicKey, connected, connect, disconnect };
}