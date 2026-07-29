import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";

import { useSidebar } from "@/hooks/useSidebar";
import { shortenAddress } from "@/utils/contractHelpers";
import ThemeToggle from "./ThemeToggle";
import { WalletId, WalletMeta } from "@/types/wallet";
import { WorkspaceSwitcher } from "@/workspaces";
import { GlobalSearch } from "@/features/search";
import { ConnectedWalletDropdown, NavLinks, WalletPickerDropdown } from "./nav";

export type NavbarProps = {
  publicKey: string | null;
  isConnecting: boolean;
  walletType: WalletId | null;
  availableWallets: WalletMeta[];
  onConnect: (walletType: WalletId) => Promise<void>;
  onDisconnect: () => void;
  onSwitch: (walletType: WalletId) => Promise<void>;
};

export default function Navbar({
  publicKey,
  isConnecting,
  walletType,
  availableWallets,
  onConnect,
  onDisconnect,
  onSwitch,
}: NavbarProps) {
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebar();

  const short = useMemo(
    () => (publicKey ? shortenAddress(publicKey, 6) : null),
    [publicKey],
  );

  const activeWalletMeta = useMemo(
    () => availableWallets.find((w) => w.id === walletType),
    [availableWallets, walletType],
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur transition-colors duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Mobile sidebar toggle */}
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

          <NavLinks />
        </div>

        <div className="flex items-center gap-4">
          <GlobalSearch />
          <WorkspaceSwitcher />
          <ThemeToggle />

          {publicKey ? (
            <ConnectedWalletDropdown
              publicKey={publicKey}
              shortAddress={short}
              walletType={walletType}
              activeWalletMeta={activeWalletMeta}
              availableWallets={availableWallets}
              onDisconnect={onDisconnect}
              onSwitch={onSwitch}
            />
          ) : (
            <WalletPickerDropdown
              isConnecting={isConnecting}
              availableWallets={availableWallets}
              onConnect={onConnect}
            />
          )}
        </div>
      </div>
    </header>
  );
}
