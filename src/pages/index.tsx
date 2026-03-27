import Head from "next/head";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Axionvera Dashboard</title>
        <meta
          name="description"
          content="Web interface for interacting with Axionvera smart contracts on Stellar (Soroban)."
        />
      </Head>
      <main className="min-h-screen transition-colors duration-300">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-10 shadow-xl dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_80px_rgba(0,0,0,0.6)] transition-all duration-300">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 transition-colors">
              <span className="h-2 w-2 rounded-full bg-axion-500" />
              Axionvera Network · Stellar (Soroban)
            </div>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl transition-colors">
              Axionvera Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 dark:text-slate-300 transition-colors">
              Connect your Stellar wallet, deposit into the Axionvera vault, withdraw tokens, claim
              rewards, and track your on-chain activity.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                aria-label="Open the dashboard to manage your vault"
                className="inline-flex items-center justify-center rounded-xl bg-axion-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-600 active:scale-95"
              >
                Open Dashboard
              </Link>
              <a
                href="https://github.com/Axionvera/axionvera-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View the project source code on GitHub"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-900/60 active:scale-95"
              >
                View on GitHub
              </a>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { title: "Wallet", body: "Freighter-style wallet connection and address display." },
              { title: "Vault", body: "Deposit, withdraw, and claim rewards via an SDK adapter." },
              { title: "History", body: "Track your latest vault transactions and statuses." }
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20 p-6 shadow-sm transition-all duration-300"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">{card.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 transition-colors">{card.body}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
