import React, { useEffect, useRef, useState } from "react";
import { WalletId, WalletMeta } from "@/types/wallet";
import WalletIcon from "./WalletIcon";

export type ConnectedWalletDropdownProps = {
  publicKey: string;
  shortAddress: string | null;
  walletType: WalletId | null;
  activeWalletMeta: WalletMeta | undefined;
  availableWallets: WalletMeta[];
  onDisconnect: () => void;
  onSwitch: (walletType: WalletId) => Promise<void>;
};

export function ConnectedWalletDropdown({
  publicKey,
  shortAddress,
  walletType,
  activeWalletMeta,
  availableWallets,
  onDisconnect,
  onSwitch,
}: ConnectedWalletDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        document.getElementById("wallet-menu-button")?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="wallet-menu-button"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Wallet options"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="wallet-dropdown"
        className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 transition hover:bg-slate-200/50 dark:hover:bg-slate-900/60"
      >
        {activeWalletMeta && (
          <WalletIcon svg={activeWalletMeta.icon} label={activeWalletMeta.label} />
        )}
        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
        <span className="hidden sm:inline">{shortAddress}</span>
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          id="wallet-dropdown"
          role="menu"
          aria-labelledby="wallet-menu-button"
          className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-50"
        >
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 mb-1">
              {activeWalletMeta && (
                <WalletIcon svg={activeWalletMeta.icon} label={activeWalletMeta.label} />
              )}
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {activeWalletMeta?.label ?? "Connected wallet"}
              </p>
            </div>
            <p
              className="break-all font-mono text-xs text-slate-500 dark:text-slate-400 select-all"
              title={publicKey}
            >
              {publicKey}
            </p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 px-2 py-2 space-y-0.5">
            <button
              id="navbar-copy-address"
              type="button"
              role="menuitem"
              onClick={() => {
                if (publicKey) navigator.clipboard.writeText(publicKey);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy Address
            </button>

            {availableWallets
              .filter((w) => w.id !== walletType)
              .map((w) => (
                <button
                  key={w.id}
                  id={`navbar-switch-wallet-${w.id}`}
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setIsOpen(false);
                    await onSwitch(w.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition"
                >
                  <WalletIcon svg={w.icon} label={w.label} />
                  Switch to {w.label}
                </button>
              ))}

            <button
              id="navbar-disconnect-wallet"
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onDisconnect();
              }}
              aria-label="Disconnect Stellar wallet"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectedWalletDropdown;
