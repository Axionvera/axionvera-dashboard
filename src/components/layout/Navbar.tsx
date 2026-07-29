import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSidebar } from "@/hooks/useSidebar";
import { shortenAddress } from "@/utils/contractHelpers";
import { ThemeToggle } from "@/components/ui";
import { NotificationCenter } from "@/features/notifications";
import { WalletId, WalletMeta } from "@/types/wallet";
import { WorkspaceSwitcher } from "@/workspaces";
import { GlobalSearch } from "@/features/search";

type NavbarProps = {
  publicKey: string | null;
  isConnecting: boolean;
  walletType: WalletId | null;
  availableWallets: WalletMeta[];
  onConnect: (walletType: WalletId) => Promise<void>;
  onDisconnect: () => void;
  onSwitch: (walletType: WalletId) => Promise<void>;
};

/** Inline SVG icon renderer — wallets ship their own SVG strings. */
function WalletIcon({ svg, label }: { svg: string; label: string }) {
  return (
    <span
      className="h-5 w-5 shrink-0 [&>svg]:h-full [&>svg]:w-full"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
      title={label}
    />
  );
}

export default function Navbar({
  publicKey,
  isConnecting,
  walletType,
  availableWallets,
  onConnect,
  onDisconnect,
  onSwitch,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [walletAvailability, setWalletAvailability] = useState<Record<string, boolean>>({});
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const walletPickerRef = useRef<HTMLDivElement>(null);
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebar();

  const short = useMemo(
    () => (publicKey ? shortenAddress(publicKey, 6) : null),
    [publicKey],
  );

  const activeWalletMeta = useMemo(
    () => availableWallets.find((w) => w.id === walletType),
    [availableWallets, walletType],
  );

  // Close the wallet dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isWalletDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(e.target as Node)) {
        setIsWalletDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsWalletDropdownOpen(false);
        document.getElementById('wallet-menu-button')?.focus();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWalletDropdownOpen]);

  // Close wallet picker on outside click
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
              style={{ transform: isSidebarOpen ? "rotate(180deg)" : "rotate(0deg)" }}
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

          <nav aria-label="Main navigation" className="hidden items-center gap-3 text-sm text-slate-600 dark:text-slate-300 sm:flex">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
              Vault
            </Link>
            <Link href="/analytics" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
              Analytics
            </Link>
            <Link href="/profile" className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
              Profile
            </Link>
            <a
              href="https://stellar.org/soroban"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Soroban
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <GlobalSearch />
          <WorkspaceSwitcher />
          <ThemeToggle />

          {/* ── Connected state ─────────────────────────────────────────── */}
          {publicKey ? (
            <div className="relative" ref={walletDropdownRef}>
              {/* Wallet address badge — click to open dropdown */}
              <button
                id="wallet-menu-button"
                type="button"
                onClick={() => setIsWalletDropdownOpen((v) => !v)}
                aria-label="Wallet options"
                aria-haspopup="menu"
                aria-expanded={isWalletDropdownOpen}
                aria-controls="wallet-dropdown"
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 transition hover:bg-slate-200/50 dark:hover:bg-slate-900/60"
              >
                {activeWalletMeta && (
                  <WalletIcon svg={activeWalletMeta.icon} label={activeWalletMeta.label} />
                )}
                <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                <span className="hidden sm:inline">{short}</span>
                <svg
                  className={`h-3 w-3 transition-transform duration-200 ${isWalletDropdownOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Connected wallet dropdown */}
              {isWalletDropdownOpen && (
                <div
                  id="wallet-dropdown"
                  role="menu"
                  aria-labelledby="wallet-menu-button"
                  className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-50"
                >
                  {/* Address display */}
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
                      title={publicKey ?? ""}
                    >
                      {publicKey}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 px-2 py-2 space-y-0.5">
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

                    {/* Switch wallet — lists other available wallets */}
                    {availableWallets.filter((w) => w.id !== walletType).map((w) => (
                      <button
                        key={w.id}
                        id={`navbar-switch-wallet-${w.id}`}
                        type="button"
                        role="menuitem"
                        onClick={async () => {
                          setIsWalletDropdownOpen(false);
                          await onSwitch(w.id);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition"
                      >
                        <WalletIcon svg={w.icon} label={w.label} />
                        Switch to {w.label}
                      </button>
                    ))}

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
            /* ── Disconnected state: wallet picker ──────────────────────── */
            <div className="relative" ref={walletPickerRef}>
              <button
                id="navbar-connect-wallet"
                type="button"
                onClick={() => {
                  if (availableWallets.length === 1) {
                    onConnect(availableWallets[0].id);
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

              {/* Wallet picker dropdown */}
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
          )}
        </div>
      </div>
    </header>
  );
}
