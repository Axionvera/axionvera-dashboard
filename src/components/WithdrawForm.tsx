import { useState } from "react";

type WithdrawFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onWithdraw: (amount: string) => Promise<void>;
};

export default function WithdrawForm({ isConnected, isSubmitting, onWithdraw }: WithdrawFormProps) {
  const [amount, setAmount] = useState("");

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6">
      <div className="text-sm font-semibold text-white">Withdraw</div>
      <div className="mt-1 text-xs text-slate-400">Withdraw tokens from the Axionvera vault.</div>

      <div className="mt-5 flex flex-col gap-3">
        <label className="text-xs text-slate-300" htmlFor="withdraw-amount">
          Amount
        </label>
        <input
          id="withdraw-amount"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-axion-500/70"
        />
        <button
          type="button"
          onClick={async () => {
            await onWithdraw(amount);
            setAmount("");
          }}
          disabled={!isConnected || isSubmitting}
          className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-900/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Withdraw"}
        </button>
      </div>
    </section>
  );
}
