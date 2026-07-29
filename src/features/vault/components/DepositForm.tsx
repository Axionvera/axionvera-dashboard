import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppTooltip, FormInput } from '@/components/ui';
import { depositSchema, DepositFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { shortenAddress } from '@/utils/contractHelpers';
import { GLOSSARY } from '@/utils/glossary';
import { useSimulation } from '@/features/transactions';
import { TransactionSimulationPreview } from '@/features/transactions';
import { Alert, Button } from '@/design-system';

type DepositFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onDeposit: (amount: string) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
  statusMessage?: string | null;
  transactionHash?: string | null;
  walletAddress?: string | null;
  walletBalance?: number | null;
};

const NETWORK_FEE_RESERVE = 0.1;

export default function DepositForm({
  isConnected,
  isSubmitting,
  onDeposit,
  status,
  statusMessage,
  transactionHash,
  walletAddress,
  walletBalance,
}: DepositFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isValid, isDirty }
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
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

  const spendableBalance =
    walletBalance !== undefined && walletBalance !== null
      ? Math.max(0, walletBalance - NETWORK_FEE_RESERVE)
      : null;

  function handleMax() {
    if (spendableBalance !== null && spendableBalance > 0) {
      setValue('amount', spendableBalance as any, { shouldValidate: true, shouldDirty: true });
      simulateLive('deposit', spendableBalance.toString());
    }
  }

  const onSubmit = async (data: DepositFormData) => {
    if (!walletAddress) {
      // No wallet connected – skip simulation and call onDeposit directly
      await onDeposit(data.amount.toString());
      return;
    }
    await simulate("deposit", data.amount.toString());
  };

  const handleConfirm = async () => {
    const amount = getValues('amount');
    try {
      await onDeposit(amount.toString());
      notify.success("Deposit Successful", `You have deposited ${amount} tokens.`);
      reset();
    } catch (error) {
      console.error('Deposit error:', error);
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
        <div className="text-sm font-semibold text-text-primary">Deposit</div>
        <div className="mt-1 text-xs text-text-muted">Deposit tokens into the Axionvera vault.</div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {/* Balance + Max */}
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Available Balance</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">
                {spendableBalance !== null ? `${spendableBalance.toFixed(4)} XLM` : '—'}
              </span>
              <button
                type="button"
                onClick={handleMax}
                disabled={!isConnected || spendableBalance === null || spendableBalance <= 0}
                className="rounded-md bg-axion-500/10 px-2 py-0.5 text-xs font-semibold text-axion-400 transition hover:bg-axion-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Max
              </button>
            </div>
          </div>

          {/* Amount field — triggers live simulation on change */}
          <FormInput
            {...register('amount', {
              onChange: (e) => simulateLive('deposit', e.target.value),
            })}
            id="deposit-amount"
            inputMode="decimal"
            placeholder="0.0"
            label="Amount"
            required
            helperText={
              <span>
                Enter amount between 0.0001 and 10,000{' '}
                <AppTooltip content={GLOSSARY.slippage}>
                  <span className="cursor-help font-semibold uppercase tracking-wider text-axion-500 underline decoration-dotted decoration-axion-500/50 underline-offset-2 transition-colors hover:text-axion-400">
                    Slippage
                  </span>
                </AppTooltip>
              </span>
            }
          />

          {simulationError && (
            <Alert variant="error">{simulationError}</Alert>
          )}

          {status !== 'idle' && (
            <Alert
              variant={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}
              title={status === 'pending' ? 'Deposit transaction pending' : status === 'success' ? 'Deposit completed' : 'Deposit failed'}
            >
              {statusMessage ?? null}
              {transactionHash ? `Tx: ${shortenAddress(transactionHash, 8)}` : null}
            </Alert>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={shouldDisableSubmit}
            loading={simulationStatus === 'loading' || isSubmitting}
            loadingLabel={simulationStatus === 'loading' ? "Simulating transaction" : "Submitting deposit"}
            className="w-full"
          >
            {simulationStatus === 'loading' ? 'Simulating…' : isSubmitting ? 'Depositing…' : 'Preview Deposit'}
          </Button>
        </form>
      </section>
    </>
  );
}
