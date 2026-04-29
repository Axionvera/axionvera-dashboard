import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSidebar } from "@/hooks/useSidebar";
import { shortenAddress } from "@/utils/contractHelpers";
import CopyButton from "./CopyButton";
import ThemeToggle from "./ThemeToggle";

type NavbarProps = {
  publicKey: string | null;
  isConnecting: boolean;
  onConnect: (walletType: any) => Promise<void>;
  onDisconnect: () => void;
};

export default function Navbar({ publicKey, isConnecting, onConnect, onDisconnect }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebar();
  const short = useMemo(
    () => (publicKey ? shortenAddress(publicKey, 6) : null),
    [publicKey]
  );

  // Close the wallet dropdown when clicking outside of it
  useEffect(() => {
    if (!isWalletDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(e.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isWalletDropdownOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur transition-colors duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">

          {/* Hamburger — visible on mobile, triggers sidebar */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
            aria-controls="main-sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 text-slate-600 dark:text-slate-300 transition hover:bg-slate-200/50 dark:hover:bg-slate-900/60 lg:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop sidebar toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isSidebarOpen}
            className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 text-slate-600 dark:text-slate-300 transition hover:bg-slate-200/50 dark:hover:bg-slate-900/60"
          >
            <svg
              className="h-5 w-5 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              style={{ transform: isSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/axionvera.svg"
              alt="Axionvera logo"
              width={36}
              height={36}
              priority
              className="rounded-xl shadow-lg shadow-axion-500/20"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Axionvera</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Dashboard</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-3 text-sm text-slate-600 dark:text-slate-300 sm:flex">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900/60">
              Vault
            </Link>
            <Link href="/profile" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900/60">
              Profile
            </Link>
            <a
              href="https://stellar.org/soroban"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900/60"
            >
              Soroban
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {publicKey ? (
            <div className="relative" ref={walletDropdownRef}>
              {/* Wallet address badge — click to open dropdown */}
              <button
                id="wallet-menu-button"
                type="button"
                onClick={() => setIsWalletDropdownOpen((v) => !v)}
                aria-label="Wallet options"
                aria-haspopup="true"
                aria-expanded={isWalletDropdownOpen}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 transition hover:bg-slate-200/50 dark:hover:bg-slate-900/60"
              >
                <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                <span className="hidden sm:inline">{short}</span>
                <svg
                  className={`h-3 w-3 transition-transform duration-200 ${isWalletDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown panel */}
              {isWalletDropdownOpen && (
                <div
                  role="menu"
                  aria-labelledby="wallet-menu-button"
                  className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-50"
                >
                  {/* Address display */}
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Connected wallet</p>
                    <p
                      className="mt-1 break-all font-mono text-xs text-slate-800 dark:text-slate-100 select-all"
                      title={publicKey ?? ''}
                    >
                      {publicKey}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 px-2 py-2">
                    {/* Copy address */}
                    <button
                      id="navbar-copy-address"
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        if (publicKey) navigator.clipboard.writeText(publicKey);
                        setIsWalletDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition"
                    >
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Address
                    </button>

                    {/* Disconnect */}
                    <button
                      id="navbar-disconnect-wallet"
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsWalletDropdownOpen(false);
                        onDisconnect();
                      }}
                      aria-label="Disconnect Stellar wallet"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onConnect('freighter')}
              disabled={isConnecting}
              aria-label={isConnecting ? "Connecting to Stellar wallet" : "Connect Stellar wallet"}
              className="rounded-xl bg-axion-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}