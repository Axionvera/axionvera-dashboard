import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { VaultProvider, useVault } from "@/hooks/useVault";
import { useWalletContext } from "@/hooks/useWallet";
import { shortenAddress } from "@/utils/contractHelpers";
import { NETWORK, AXIONVERA_VAULT_CONTRACT_ID } from "@/utils/networkConfig";
import { WalletId, WalletMeta } from "@/types/wallet";

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

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border-slate-700 bg-slate-900/50 text-slate-300";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}>
      {label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">{label}</p>
        <StatusPill label={tone === "success" ? "Live" : tone === "warning" ? "Action" : "Ready"} tone={tone} />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{helper}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DashboardContent({ isConnected }: { isConnected: boolean }) {
  const {
    balance,
    rewards,
    transactions,
    isLoading,
    isSubmitting,
    isClaiming,
    error,
    deposit,
    withdraw,
    claimRewards,
    depositStatus,
    depositHash,
    depositError,
    withdrawStatus,
    withdrawHash,
    withdrawError,
  } = useVault();

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const latestTransactions = useMemo(() => transactions.slice(0, 6), [transactions]);

  async function handleDeposit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await deposit(depositAmount);
    setDepositAmount("");
  }

  async function handleWithdraw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await withdraw(withdrawAmount);
    setWithdrawAmount("");
  }

  return (
    <div className="mt-8 grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Vault Balance"
          value={isLoading ? "Loading…" : balance}
          helper="Current simulated or indexed vault balance."
          tone="success"
        />
        <MetricCard
          label="Claimable Rewards"
          value={isLoading ? "Loading…" : rewards}
          helper="Rewards available through the vault adapter."
          tone="warning"
        />
        <MetricCard
          label="Network"
          value={NETWORK}
          helper="Configured Stellar/Soroban network."
        />
        <MetricCard
          label="Contract"
          value={AXIONVERA_VAULT_CONTRACT_ID ? "Configured" : "Missing"}
          helper="Vault contract environment configuration."
          tone={AXIONVERA_VAULT_CONTRACT_ID ? "success" : "warning"}
        />
      </section>

      {!isConnected && (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
          Connect a Stellar wallet to use live vault actions. The dashboard layout is ready.
        </section>
      )}

      {error && (
        <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
          {error}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <ActionCard
          title="Deposit"
          description="Deposit tokens into the Axionvera vault through the SDK adapter."
        >
          <form onSubmit={handleDeposit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">Amount</span>
              <input
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="10"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-axion-500"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-axion-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && depositStatus === "pending" ? "Depositing…" : "Deposit"}
            </button>
            {depositStatus !== "idle" && (
              <p className="text-xs text-slate-400">
                Status: <span className="text-slate-200">{depositStatus}</span>
                {depositHash ? ` · ${depositHash}` : ""}
              </p>
            )}
            {depositError && <p className="text-xs text-red-300">{depositError}</p>}
          </form>
        </ActionCard>

        <ActionCard
          title="Withdraw"
          description="Withdraw available vault balance back to your connected wallet."
        >
          <form onSubmit={handleWithdraw} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">Amount</span>
              <input
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="5"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-axion-500"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && withdrawStatus === "pending" ? "Withdrawing…" : "Withdraw"}
            </button>
            {withdrawStatus !== "idle" && (
              <p className="text-xs text-slate-400">
                Status: <span className="text-slate-200">{withdrawStatus}</span>
                {withdrawHash ? ` · ${withdrawHash}` : ""}
              </p>
            )}
            {withdrawError && <p className="text-xs text-red-300">{withdrawError}</p>}
          </form>
        </ActionCard>

        <ActionCard
          title="Rewards"
          description="Claim accumulated Axionvera vault rewards."
        >
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">Available rewards</p>
            <p className="mt-2 text-3xl font-semibold text-white">{rewards}</p>
          </div>
          <button
            type="button"
            onClick={() => void claimRewards()}
            disabled={isClaiming}
            className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClaiming ? "Claiming…" : "Claim Rewards"}
          </button>
        </ActionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Transaction History</h2>
              <p className="mt-1 text-sm text-slate-400">Latest vault activity and transaction status.</p>
            </div>
            <StatusPill label={`${transactions.length} total`} />
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-800">
            {latestTransactions.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">
                No vault transactions yet. Deposit or withdraw to start building activity.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {latestTransactions.map((tx) => (
                  <div key={tx.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="text-sm font-medium capitalize text-white">{tx.type}</p>
                      <p className="mt-1 text-xs text-slate-500">{tx.createdAt}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <span className="text-sm font-semibold text-slate-200">{tx.amount}</span>
                      <StatusPill
                        label={tx.status}
                        tone={tx.status === "success" || tx.status === "confirmed" ? "success" : tx.status === "pending" ? "warning" : "neutral"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
          <h2 className="text-lg font-semibold text-white">Protocol Status</h2>
          <p className="mt-1 text-sm text-slate-400">Current dashboard runtime configuration.</p>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
              <span className="text-slate-400">Wallet</span>
              <span className="font-medium text-white">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
              <span className="text-slate-400">Vault SDK</span>
              <span className="font-medium text-emerald-300">Ready</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
              <span className="text-slate-400">Soroban</span>
              <span className="font-medium text-emerald-300">{NETWORK}</span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Activity Feed</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>• Dashboard initialized</p>
              <p>• Vault adapter loaded</p>
              <p>• Wallet bridge waiting for user action</p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

export default function HomePage() {
  const { publicKey, isConnected, isConnecting, connect, disconnect, availableWallets } =
    useWalletContext();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [walletAvailability, setWalletAvailability] = useState<Record<string, boolean>>({});
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    (async () => {
      const { isWalletAvailable } = await import("@/services/walletService");
      const entries = await Promise.all(
        availableWallets.map(async (w) => {
          try {
            const ok = await isWalletAvailable(w.id);
            return [w.id, ok] as const;
          } catch {
            return [w.id, false] as const;
          }
        }),
      );

      if (!cancelled) setWalletAvailability(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
    };
  }, [availableWallets]);

  useEffect(() => {
    if (!isPickerOpen) return;

    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isPickerOpen]);

  function handleConnect(walletId: WalletId) {
    setIsPickerOpen(false);
    connect(walletId);
  }

  return (
    <>
      <Head>
        <title>Axionvera Dashboard</title>
        <meta
          name="description"
          content="Web interface for interacting with Axionvera smart contracts on Stellar Soroban."
        />
      </Head>

      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-axion-500" />
                Axionvera Network · Stellar Soroban
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Axionvera Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                Manage vault deposits, withdrawals, rewards, transaction history, and protocol status from one interface.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {isConnected ? (
                <>
                  <div className="inline-flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-sm font-medium text-slate-200">
                      {shortenAddress(publicKey!, 6)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={disconnect}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <div className="relative" ref={pickerRef}>
                    <button
                      id="home-connect-wallet"
                      type="button"
                      onClick={() => {
                        if (availableWallets.length === 1) {
                          handleConnect(availableWallets[0].id);
                        } else {
                          setIsPickerOpen((v) => !v);
                        }
                      }}
                      disabled={isConnecting}
                      aria-label={isConnecting ? "Connecting to Stellar wallet" : "Connect Stellar wallet"}
                      aria-haspopup={availableWallets.length > 1 ? "true" : undefined}
                      aria-expanded={availableWallets.length > 1 ? isPickerOpen : undefined}
                      className="inline-flex items-center justify-center rounded-xl bg-axion-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isConnecting ? "Connecting…" : "Connect Wallet"}
                    </button>

                    {isPickerOpen && !isConnecting && (
                      <div
                        id="home-wallet-picker"
                        role="menu"
                        aria-labelledby="home-connect-wallet"
                        className="absolute right-0 z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl ring-1 ring-white/5"
                      >
                        <p className="px-4 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                          Choose a wallet
                        </p>
                        <div className="space-y-0.5 px-2 pb-2">
                          {availableWallets.map((w: WalletMeta) => {
                            const available = walletAvailability[w.id] ?? true;

                            return (
                              <button
                                key={w.id}
                                id={`home-connect-${w.id}`}
                                type="button"
                                role="menuitem"
                                onClick={() => handleConnect(w.id)}
                                title={!available ? `Install ${w.label}` : w.description}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-200 transition hover:bg-slate-900"
                              >
                                <WalletIcon svg={w.icon} label={w.label} />
                                <div className="min-w-0 flex-1 text-left">
                                  <div className="font-medium leading-tight">{w.label}</div>
                                  <div className="truncate text-xs text-slate-500">{w.description}</div>
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

                  <Link
                    href="https://github.com/Axionvera/axionvera-dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                  >
                    GitHub
                  </Link>
                </>
              )}
            </div>
          </header>

          <VaultProvider walletAddress={publicKey}>
            <DashboardContent isConnected={isConnected} />
          </VaultProvider>
        </div>
      </main>
    </>
  );
}
