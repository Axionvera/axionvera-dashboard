'use client';

import { useEffect, useRef } from 'react';
import { formatAmount, shortenAddress } from '@/utils/contractHelpers';
import { NETWORK, HORIZON_URL } from '@/utils/networkConfig';
import { useConfetti } from '@/hooks/useConfetti';

type TransactionSuccessProps = {
  amount: string;
  assetSymbol?: string;
  transactionHash: string;
  type: 'deposit' | 'withdraw';
  onClose: () => void;
};

export default function TransactionSuccess({
  amount,
  assetSymbol = 'AXNV',
  transactionHash,
  type,
  onClose,
}: TransactionSuccessProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { triggerConfetti } = useConfetti();

  // Trigger confetti animation on mount
  useEffect(() => {
    triggerConfetti();
  }, [triggerConfetti]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const explorerUrl = `${HORIZON_URL}/transactions/${transactionHash}`;
  const actionText = type === 'deposit' ? 'Deposited' : 'Withdrawn';

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-40"
        aria-hidden="true"
      />

      <div className="relative z-50 w-full max-w-sm rounded-2xl border border-border-primary bg-background-primary p-8 shadow-2xl">
        {/* Animated Checkmark */}
        <div className="mb-6 flex justify-center">
          <div className="relative h-24 w-24">
            <svg
              className="h-full w-full animate-pulse"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Circle background */}
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-emerald-500"
                strokeWidth="3"
              />

              {/* Animated checkmark */}
              <path
                d="M 30 50 L 45 65 L 70 35"
                className="stroke-emerald-500"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                style={{
                  strokeDasharray: '80px',
                  strokeDashoffset: '80px',
                  animation: 'checkmarkAnimation 0.6s ease-out forwards',
                }}
              />
            </svg>
            <style>{`
              @keyframes checkmarkAnimation {
                0% {
                  stroke-dashoffset: 80px;
                }
                100% {
                  stroke-dashoffset: 0;
                }
              }
            `}</style>
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-center text-2xl font-bold text-text-primary">
          {type === 'deposit' ? 'Deposit' : 'Withdrawal'} Confirmed!
        </h2>

        <p className="mt-2 text-center text-sm text-text-muted">
          Your transaction has been successfully processed on the blockchain.
        </p>

        {/* Transaction Details */}
        <div className="mt-6 space-y-4 rounded-xl border border-border-primary bg-background-secondary/40 p-4">
          {/* Amount Display */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">{actionText} Amount</span>
            <span className="flex items-center gap-2 text-lg font-semibold text-emerald-200">
              {formatAmount(amount)}
              <span className="text-sm text-text-muted">{assetSymbol}</span>
            </span>
          </div>

          {/* Transaction Hash */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-text-muted">Transaction Hash</span>
            <code className="break-all rounded bg-background-primary/50 px-2 py-1 font-mono text-xs text-text-secondary">
              {shortenAddress(transactionHash, 16)}
            </code>
          </div>

          {/* Network Info */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-text-muted capitalize">Network</span>
            <span className="text-xs font-medium text-text-primary capitalize">
              {NETWORK}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-3">
          {/* View on Explorer Button */}
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-axion-500 bg-axion-500/10 px-4 py-2.5 font-medium text-axion-200 transition-all duration-200 hover:bg-axion-500/20 hover:shadow-lg hover:shadow-axion-500/20"
            aria-label={`View transaction on Stellar Explorer - opens in new window`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View on Explorer
          </a>

          {/* Return to Dashboard Button */}
          <button
            onClick={onClose}
            className="rounded-lg bg-emerald-500/20 px-4 py-2.5 font-medium text-emerald-200 transition-all duration-200 hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-background-primary"
            aria-label="Return to dashboard"
          >
            Return to Dashboard
          </button>
        </div>

        {/* Close hint */}
        <p className="mt-4 text-center text-xs text-text-muted">
          or press <kbd className="rounded bg-background-secondary px-1 font-mono">Esc</kbd>
        </p>
      </div>
    </div>
  );
}
