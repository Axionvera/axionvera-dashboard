import { useState } from "react";

type DepositFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onDeposit: (amount: string) => Promise<void>;
};

export default function DepositForm({ isConnected, isSubmitting, onDeposit }: DepositFormProps) {
  const [amount, setAmount] = useState("");

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
      <div className="text-sm font-semibold text-white">Deposit</div>
      <div className="mt-1 text-xs text-slate-400">Deposit tokens into the Axionvera vault.</div>

      <div className="mt-5 flex flex-col gap-3">
        <label className="text-xs text-slate-300" htmlFor="deposit-amount">
          Amount
        </label>
        <input
          id="deposit-amount"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-axion-500/70"
        />
        <button
          type="button"
          onClick={async () => {
            await onDeposit(amount);
            setAmount("");
          }}
          disabled={!isConnected || isSubmitting}
          className="rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Deposit"}
        </button>
      </div>
    </section>
  );
}
