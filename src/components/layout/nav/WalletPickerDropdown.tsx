import React, { useEffect, useRef, useState } from "react";
import { WalletId, WalletMeta } from "@/types/wallet";
import WalletIcon from "./WalletIcon";

export type WalletPickerDropdownProps = {
  isConnecting: boolean;
  availableWallets: WalletMeta[];
  onConnect: (walletType: WalletId) => Promise<void>;
};

export function WalletPickerDropdown({
  isConnecting,
  availableWallets,
  onConnect,
}: WalletPickerDropdownProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [walletAvailability] = useState<Record<string, boolean>>({});
  const walletPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPickerOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (walletPickerRef.current && !walletPickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPickerOpen]);

  return (
    <div className="relative" ref={walletPickerRef}>
      <button
        id="navbar-connect-wallet"
        type="button"
        onClick={() => {
          if (availableWallets.length === 1) {
            void onConnect(availableWallets[0].id);
          } else {
            setIsPickerOpen((v) => !v);
          }
        }}
        disabled={isConnecting}
        aria-label={isConnecting ? "Connecting to Stellar wallet" : "Connect Stellar wallet"}
        aria-haspopup={availableWallets.length > 1 ? "true" : undefined}
        aria-expanded={availableWallets.length > 1 ? isPickerOpen : undefined}
        className="rounded-xl bg-axion-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </button>

      {isPickerOpen && !isConnecting && (
        <div
          id="navbar-wallet-picker"
          role="menu"
          aria-labelledby="navbar-connect-wallet"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-50 overflow-hidden"
        >
          <p className="px-4 pt-3 pb-1 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Choose a wallet
          </p>
          <div className="px-2 pb-2 space-y-0.5">
            {availableWallets.map((w) => {
              const available = walletAvailability[w.id] ?? true;
              return (
                <button
                  key={w.id}
                  id={`navbar-connect-${w.id}`}
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setIsPickerOpen(false);
                    await onConnect(w.id);
                  }}
                  title={!available ? `Install ${w.label}` : w.description}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition group"
                >
                  <WalletIcon svg={w.icon} label={w.label} />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-medium leading-tight">{w.label}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {w.description}
                    </div>
                  </div>
                  {!available && (
                    <a
                      href={w.installUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 text-xs text-axion-500 hover:underline"
                    >
                      Install
                    </a>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletPickerDropdown;
