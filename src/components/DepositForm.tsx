import { FormInput } from './FormInput';
import { useFormValidation } from '@/hooks/useFormValidation';
import { depositSchema, DepositFormData } from '@/utils/validation';

type DepositFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onDeposit: (amount: string) => Promise<void>;
};

export default function DepositForm({ isConnected, isSubmitting, onDeposit }: DepositFormProps) {
  const initialValues: DepositFormData = {
    amount: '',
  };

  const {
    getFieldProps,
    shouldDisableSubmit,
    handleSubmit,
    reset,
  } = useFormValidation({
    schema: depositSchema,
    initialValues,
    onSubmit: async (data) => {
      await onDeposit(data.amount);
      reset();
    },
  });

  const amountProps = getFieldProps('amount');

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/30 p-6 shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">Deposit</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Deposit tokens into the Axionvera vault.</div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mt-5 space-y-4">
        <FormInput
          {...amountProps}
          id="deposit-amount"
          inputMode="decimal"
          placeholder="0.0"
          label="Amount"
          required
          helperText="Enter amount between 0.0001 and 10,000"
        />

        <button
          type="submit"
          disabled={!isConnected || shouldDisableSubmit() || isSubmitting}
          aria-label={isSubmitting ? "Submitting deposit" : "Deposit tokens"}
          className="w-full rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Deposit"}
        </button>
      </form>
    </section>
  );
}
