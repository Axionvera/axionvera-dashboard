import React from "react";
import Link from "next/link";

export function NavLinks() {
  return (
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
  );
}

export default NavLinks;
