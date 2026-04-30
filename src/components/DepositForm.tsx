import { useState } from 'react';
import { FormInput } from './FormInput';
import { TransactionStepper } from './TransactionStepper';
import { useFormValidation } from '@/hooks/useFormValidation';
import { depositSchema } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { shortenAddress, type TransactionSimulation } from '@/utils/contractHelpers';
import { ConfirmTransactionModal } from './ConfirmTransactionModal';
import type { TxStep } from '@/utils/pollTransaction';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';
import { depositSchema, DepositFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { shortenAddress } from '@/utils/contractHelpers';
import { AppTooltip } from './AppTooltip';
import { GLOSSARY } from '@/utils/glossary';
import type { VaultAsset } from '@/utils/vaultAssets';
import { truncateAddress } from '@/utils/formatters';
import { shortenAddress, type TransactionSimulation } from '@/utils/contractHelpers';
import { ConfirmTransactionModal } from './ConfirmTransactionModal';
import { createDepositSchema, DepositFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { shortenAddress, type TransactionSimulation } from '@/utils/contractHelpers';
import { ConfirmTransactionModal } from './ConfirmTransactionModal';
import { AppTooltip } from './AppTooltip';
import { GLOSSARY } from '@/utils/glossary';
import { useState } from "react";
import ConfirmTransactionModal from '@/components/modals/ConfirmTransactionModal';
import { FormSkeleton } from './Skeletons';
import { formatAmount } from '@/utils/contractHelpers';

type DepositFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  isLoading?: boolean;
  onDeposit: (amount: string) => Promise<void>;
  status: 'idle' | 'pending' | 'success' | 'error';
  txStep?: TxStep | null;
  statusMessage?: string | null;
  transactionHash?: string | null;
  walletBalance?: string | null;
  selectedAsset: VaultAsset;
  assets: VaultAsset[];
  onAssetChange: (assetId: string) => void;
  defaultAmount?: string;
  walletBalance?: number | null;
  onSimulate?: (amount: string) => Promise<TransactionSimulation>;
  isNetworkMismatch?: boolean;
};

const NETWORK_FEE_RESERVE = 0.1;

export default function DepositForm({
  isConnected,
  isSubmitting,
  isLoading,
  onDeposit,
  status,
  txStep,
  statusMessage,
  transactionHash,
  defaultAmount = ""
  walletBalance,
  selectedAsset,
  assets,
  onAssetChange,
}: DepositFormProps) {
  onSimulate,
  isNetworkMismatch,
}: DepositFormProps) {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulationData, setSimulationData] = useState<TransactionSimulation | null>(null);
  const [pendingAmount, setPendingAmount] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('');

  const executeDeposit = async (amount: string) => {
    try {
      await onDeposit(amount);
      notify.success("Deposit Successful", `You have deposited ${amount} tokens.`);
      reset();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Deposit error:', error);
      setIsModalOpen(false);
    }
  };

  const handleFormSubmit = async (data: DepositFormData) => {
    const amountStr = data.amount.toString();

  const { values, errors, isDirty, isValid, shouldDisableSubmit, updateField, handleBlur, handleSubmit, reset } =
    useFormValidation({
      schema: depositSchema,
      initialValues: { amount: '' },
    });

  const executeDeposit = async (amount: string) => {
    try {
      await onDeposit(amount);
      reset();
      setIsModalOpen(false);
    } catch {
      setIsModalOpen(false);
    }
  };

  const onSubmit = async () => {
    const { isValid: valid } = depositSchema.safeParse(values)
      ? { isValid: depositSchema.safeParse(values).success }
      : { isValid: false };

    if (!valid) return;

    const amountStr = values.amount.toString();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isValid, isDirty }
    formState: { isValid, isDirty, errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    mode: 'onChange',
    defaultValues: {
      amount: '' as any,
    }
  });

  const spendableBalance =
    walletBalance !== undefined && walletBalance !== null
      ? Math.max(0, Number(walletBalance) - (selectedAsset.isNative ? NETWORK_FEE_RESERVE : 0))
      : null;

  function handleMax() {
    if (spendableBalance !== null && spendableBalance > 0) {
      setValue('amount', spendableBalance as any, {
        shouldValidate: true,
        shouldDirty: true,
      });
      amount: '' as unknown as number,
    },
  });
    setValue,
    formState: { errors, isValid, isDirty }
    formState: { errors, isValid, isDirty },
  } = useForm<DepositFormData>({
    resolver: zodResolver(createDepositSchema(walletBalance ?? null)),
    mode: 'onChange',
    defaultValues: {
      amount: '' as any,
    },
  });

  const handleConfirm = async () => {
    if (!pendingAmount) return;

    try {
      await onDeposit(data.amount.toString());
      notify.success('Deposit Successful', `You have deposited ${data.amount} tokens.`);
      await onDeposit(pendingAmount);
      notify.success("Deposit Successful", `You have deposited ${pendingAmount} tokens.`);
      reset();
    } catch (error) {
      console.error('Deposit error:', error);
    } finally {
      setIsModalOpen(false);
      setPendingAmount(null);
    }
  };
  // Show success modal when status changes to success and we have a hash
  // Set default amount from props when component mounts and wallet is connected
  useEffect(() => {
    if (defaultAmount && isConnected) {
      setValue('amount', defaultAmount as any, { shouldValidate: true, shouldDirty: true });
    }
  }, [defaultAmount, isConnected, setValue]);
  if (isLoading) return <FormSkeleton />;

    if (onSimulate) {
      setPendingAmount(amountStr);
      setIsModalOpen(true);
      setSimulationData(null);
      setIsSimulating(true);
      try {
        const sim = await onSimulate(amountStr);
        setSimulationData(sim);
      } catch {
        setIsModalOpen(false);
        notify.error('Simulation Failed', 'Could not simulate transaction.');
      } finally {
        setIsSimulating(false);
      }
    } else {
      await executeDeposit(amountStr);
    }
  }

  const onSubmit = async (data: DepositFormData) => {
    try {
      await onDeposit(data.amount.toString());
      notify.success("Deposit Successful", `You have deposited ${data.amount} ${selectedAsset.symbol}.`);
  const {
    isDirty,
    isSubmitting: isFormSubmitting,
    isValid,
    getFieldProps,
    reset,
    handleSubmit,
  } = useFormValidation({
    schema: depositSchema,
    initialValues: { amount: 0 },
    onSubmit: handleFormSubmit,
  });

  // Show success modal when status changes to success and we have a hash
  useEffect(() => {
    if (status === 'success' && transactionHash) {
      setIsModalOpen(true);
      notify.success("Deposit Successful", `You have deposited ${depositAmount} tokens.`);
  const isDisabled = !isConnected || shouldDisableSubmit() || isSubmitting || isSimulating;
  const executeDeposit = async (amount: string) => {
    try {
      const onSubmit = async (data: DepositFormData) => {
        setPendingAmount(data.amount.toString());
        setIsModalOpen(true);
      };
      notify.success("Deposit Successful", `You have deposited ${data.amount} tokens.`);
      await onDeposit(amount);
      notify.success("Deposit Successful", `You have deposited ${amount} tokens.`);
      reset();
    } catch (error) {
      console.error('Deposit error:', error);
    }
  }, [status, transactionHash, depositAmount]);

  const shouldDisableSubmit = !isConnected || !isValid || !isDirty || isSubmitting;

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="text-sm font-semibold text-text-primary">Deposit</div>
      <div className="mt-1 text-xs text-text-muted">Deposit tokens into the Axionvera vault.</div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="deposit-asset" className="text-xs font-medium text-text-secondary">
            Asset
          </label>
          <select
            id="deposit-asset"
            value={selectedAsset.id}
            onChange={(event) => onAssetChange(event.target.value)}
            disabled={assets.length <= 1}
            className="w-full rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm text-text-primary transition focus:border-axion-500 focus:outline-none focus:ring-2 focus:ring-axion-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Available Balance</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">
              {spendableBalance !== null ? `${spendableBalance.toFixed(4)} ${selectedAsset.symbol}` : '—'}
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

        <FormInput
          {...register('amount')}
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

  const handleCancel = () => {
    setIsModalOpen(false);
    setPendingAmount(null);
  };

  const shouldDisableSubmit = !isConnected || !isValid || !isDirty || isSubmitting;
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSimulationData(null);
  };

  const shouldDisableSubmit = !isConnected || !isValid() || !isDirty || isFormSubmitting || isSimulating;
  const amountProps = getFieldProps('amount');
  const shouldDisableSubmit = !isConnected || !isValid || !isDirty || isSubmitting || isSimulating || !!isNetworkMismatch;

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="text-sm font-semibold text-text-primary">Deposit</div>
      <div className="mt-1 text-xs text-text-muted">Deposit tokens into the Axionvera vault.</div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <FormInput
          {...register('amount')}
          id="deposit-amount"
          inputMode="decimal"
          placeholder="0.0"
          label="Amount"
          required
          error={errors.amount}
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
    <>
      <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
        <div className="text-sm font-semibold text-text-primary">Deposit</div>
        <div className="mt-1 text-xs text-text-muted">Deposit tokens into the Axionvera vault.</div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
            onSubmit();
          }}
          className="mt-5 space-y-4"
        >
          <FormInput
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {walletBalance !== null && walletBalance !== undefined && (
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Wallet Balance</span>
              <span className="font-medium text-text-primary">{formatAmount(walletBalance.toString())}</span>
            </div>
          )}

          <FormInput
            {...register('amount')}
            id="deposit-amount"
            inputMode="decimal"
            placeholder="0.0"
            label="Amount"
            required
            value={values.amount}
            onChange={(v) => updateField('amount', v)}
            onBlur={() => handleBlur('amount')}
            error={errors.amount}
            helperText="Enter amount between 0.0001 and 10,000"
          />

          {txStep && status === 'pending' ? (
            <div role="status" aria-live="polite" className="pt-1">
              <TransactionStepper txStep={txStep} />
            </div>
          ) : status !== 'idle' && status !== 'success' ? (
          {status !== 'idle' ? (
            helperText={`Enter amount between 0.0001 and ${walletBalance ? formatAmount(walletBalance.toString()) : '10,000'}`}
          />

        {status !== 'idle' ? (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${
              status === 'success'
                ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200'
                : status === 'error'
            className={`rounded-xl border px-4 py-3 text-sm ${status === 'success'
              ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200'
              : status === 'error'
                ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                : 'border-border-primary bg-background-secondary/30 text-text-primary'
              }`}
          >
            <div className="font-medium">
              {status === 'pending'
                ? 'Deposit transaction pending'
                : status === 'success'
                  ? 'Deposit completed'
                  : 'Deposit failed'}
            </div>
            {statusMessage ? (
              <div className="mt-1 text-xs opacity-90">{statusMessage}</div>
            ) : null}
            {transactionHash ? (
              <div className="mt-1 text-xs opacity-80">
                Tx: {truncateAddress(transactionHash, 8, 8)}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={shouldDisableSubmit}
          aria-label={isSubmitting ? 'Submitting deposit' : 'Deposit tokens'}
          className="w-full rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Submitting...' : 'Deposit'}
        </button>
      </form>
    </section>
              {status === 'pending' ? 'Deposit transaction pending' : status === 'success' ? 'Deposit completed' : 'Deposit failed'}
          {status !== 'idle' && status !== 'success' ? (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border px-4 py-3 text-sm ${
                status === 'error'
                  ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                  : status === 'success'
                  ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200'
                  : 'border-border-primary bg-background-secondary/30 text-text-primary'
            }`}
          >
            <div className="font-medium">
              {status === 'pending'
                ? 'Deposit transaction pending'
                : status === 'success'
                  ? 'Deposit completed'
                  : 'Deposit failed'}
            </div>
            {statusMessage ? (
              <div className="mt-1 text-xs opacity-90">{statusMessage}</div>
            ) : null}
            {transactionHash ? (
              <div className="mt-1 text-xs opacity-80">
                Tx: {shortenAddress(transactionHash, 8)}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={shouldDisableSubmit}
          aria-label={isSubmitting ? "Submitting deposit" : "Deposit tokens"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Depositing {selectedAsset.symbol}...
            </>
          ) : (
            "Deposit"
          )}
        </button>
      </form>
    </section>
  );
}
              }`}
            >
              <div className="font-medium">
                {status === 'pending' ? 'Confirming Transaction...' : 'Deposit failed'}
                {status === 'pending' ? 'Deposit transaction pending' : status === 'success' ? 'Deposit completed' : 'Deposit failed'}
              </div>
              {statusMessage ? <div className="mt-1 text-xs opacity-90">{statusMessage}</div> : null}
              {transactionHash ? (
                <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
              ) : null}
            </div>
          ) : status === 'success' && transactionHash ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-axion-500/30 bg-axion-500/10 px-4 py-3 text-sm text-axion-300"
            >
              <div className="font-medium">Deposit completed</div>
              <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={shouldDisableSubmit || isFormSubmitting}
            aria-label={isFormSubmitting ? "Submitting deposit" : "Deposit tokens"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isFormSubmitting ? (
              <>
            disabled={isDisabled}
            aria-label={isSubmitting ? 'Submitting deposit' : 'Deposit tokens'}
            disabled={shouldDisableSubmit}
            aria-label={isSubmitting ? "Submitting deposit" : "Deposit tokens"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Depositing...
              </>
            ) : (
              'Deposit'
              "Deposit"
            )}
          </button>
        </form>
      </section>

      <ConfirmTransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSimulationData(null); }}
        onConfirm={() => { if (pendingAmount) executeDeposit(pendingAmount); }}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        actionType="Deposit"
        assetAmount={pendingAmount || "0"}
        networkFee="~0.00001 XLM" // replace with real estimate later
        contractId="CDLZ...XYZ" // replace with actual contract
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        action="deposit"
        amount={pendingAmount}
        simulation={simulationData}
        isConfirming={isSubmitting}
      />
    </>
  );
}

