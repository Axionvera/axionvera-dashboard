import { FormInput } from './FormInput';
import { useFormValidation } from '@/hooks/useFormValidation';
import { withdrawSchema, WithdrawFormData } from '@/utils/validation';

type WithdrawFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onWithdraw: (amount: string) => Promise<void>;
};

export default function WithdrawForm({ isConnected, isSubmitting, onWithdraw }: WithdrawFormProps) {
  const initialValues: WithdrawFormData = {
    amount: '',
  };

  const {
    getFieldProps,
    shouldDisableSubmit,
    handleSubmit,
    reset,
  } = useFormValidation({
    schema: withdrawSchema,
    initialValues,
    onSubmit: async (data) => {
      await onWithdraw(data.amount);
      reset();
    },
  });

  const amountProps = getFieldProps('amount');

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="text-sm font-semibold text-text-primary">Withdraw</div>
      <div className="mt-1 text-xs text-text-muted">Withdraw tokens from the Axionvera vault.</div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mt-5 space-y-4">
        <FormInput
          {...amountProps}
          id="withdraw-amount"
          inputMode="decimal"
          placeholder="0.0"
          label="Amount"
          required
          helperText="Enter amount between 0.0001 and 10,000"
        />

        <button
          type="submit"
          disabled={!isConnected || shouldDisableSubmit() || isSubmitting}
          aria-label={isSubmitting ? "Submitting withdrawal" : "Withdraw tokens"}
          className="w-full rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Withdraw"}
        </button>
      </form>
    </section>
  );
}
