import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from '@/components/ui';
import { createWithdrawSchema, WithdrawFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { formatAmount, shortenAddress } from '@/utils/contractHelpers';
import { useSimulation } from '@/features/transactions';
import { TransactionSimulationPreview } from '@/features/transactions';
import { Alert, Button } from '@/design-system';

type WithdrawFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  balance: string;
  onWithdraw: (amount: string) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
  statusMessage?: string | null;
  transactionHash?: string | null;
  walletAddress?: string | null;
};

export default function WithdrawForm({
  isConnected,
  isSubmitting,
  balance,
  onWithdraw,
  status,
  statusMessage,
  transactionHash,
  walletAddress,
}: WithdrawFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid, isDirty }
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(createWithdrawSchema(parseFloat(balance))),
    mode: 'onChange',
    defaultValues: { amount: '' as any }
  });

  const {
    simulationStatus,
    simulationOutcome,
    simulationSteps,
    simulationWarnings,
    simulationError,
    simulationErrorCode,
    simulationErrorFix,
    simulate,
    simulateLive,
    resetSimulation,
  } = useSimulation(walletAddress ?? null);

  const onSubmit = async (data: WithdrawFormData) => {
    if (!walletAddress) {
      // No wallet address – skip simulation and call onWithdraw directly
      await onWithdraw(data.amount.toString());
      return;
    }
    await simulate("withdraw", data.amount.toString());
  };

  const handleConfirm = async () => {
    const amount = getValues('amount');
    try {
      await onWithdraw(amount.toString());
      notify.success("Withdrawal Successful", `You have withdrawn ${amount} tokens.`);
      reset();
    } catch (error) {
      console.error('Withdrawal error:', error);
    } finally {
      resetSimulation();
    }
  };

  const shouldDisableSubmit =
    !isConnected || !isValid || !isDirty || isSubmitting || simulationStatus === 'loading';

  return (
    <>
      {/* Confirmation modal — shown only after explicit "Preview" press */}
      {simulationOutcome && simulationStatus === 'ready' && (
        <TransactionSimulationPreview
          result={simulationOutcome}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirm}
          onCancel={resetSimulation}
        />
      )}

      <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
        <div className="text-sm font-semibold text-text-primary">Withdraw</div>
        <div className="mt-1 text-xs text-text-muted">Withdraw tokens from the Axionvera vault.</div>
        <div className="mt-3 rounded-xl border border-border-primary bg-background-secondary/20 px-4 py-3 text-xs text-text-secondary">
          Available balance:{' '}
          <span className="font-medium text-text-primary">{formatAmount(balance)}</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {/* Amount field — triggers live simulation on change */}
          <FormInput
            {...register('amount', {
              onChange: (e) => simulateLive('withdraw', e.target.value),
            })}
            id="withdraw-amount"
            inputMode="decimal"
            placeholder="0.0"
            label="Amount"
            required
            error={errors.amount}
            helperText={`Enter amount between 0.0001 and ${formatAmount(balance)}`}
          />

          {simulationError && (
            <Alert variant="error">{simulationError}</Alert>
          )}

          {status !== 'idle' && (
            <Alert
              variant={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}
              title={status === 'pending' ? 'Withdrawal transaction pending' : status === 'success' ? 'Withdrawal completed' : 'Withdrawal failed'}
            >
              {statusMessage ?? null}
              {transactionHash ? `Tx: ${shortenAddress(transactionHash, 8)}` : null}
            </Alert>
          )}

          <Button
            type="submit"
            variant="secondary"
            size="md"
            disabled={shouldDisableSubmit}
            loading={simulationStatus === 'loading' || isSubmitting}
            loadingLabel={simulationStatus === 'loading' ? "Simulating transaction" : "Submitting withdrawal"}
            className="w-full"
          >
            {simulationStatus === 'loading' ? 'Simulating…' : isSubmitting ? 'Withdrawing…' : 'Preview Withdrawal'}
          </Button>
        </form>
      </section>
    </>
  );
}
