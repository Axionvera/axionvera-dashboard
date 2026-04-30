import React, { useState } from 'react';
import type { TransactionSimulation } from '@/utils/contractHelpers';

type ConfirmTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'deposit' | 'withdraw';
  amount: string;
  simulation: TransactionSimulation | null;
  isConfirming: boolean;
};

export function ConfirmTransactionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  amount,
  simulation,
  isConfirming
}: ConfirmTransactionModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border-primary bg-background-primary p-6 shadow-2xl">
        <h2 id="modal-title" className="text-xl font-bold text-text-primary capitalize mb-4">
          Confirm {action}
        </h2>
        
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center bg-background-secondary/50 p-3 rounded-xl border border-border-primary">
            <span className="text-sm text-text-muted">Amount</span>
            <span className="font-medium text-text-primary">{amount} XLM</span>
          </div>

          {simulation ? (
            <div className="flex gap-4">
              <div className="flex-1 bg-background-secondary/50 p-3 rounded-xl border border-border-primary">
                <div className="text-xs text-text-muted mb-1">Estimated Fee</div>
                <div className="font-medium text-text-primary">{simulation.estimatedFee} XLM</div>
              </div>
              <div className="flex-1 bg-background-secondary/50 p-3 rounded-xl border border-border-primary">
                <div className="text-xs text-text-muted mb-1">Max Fee</div>
                <div className="font-medium text-text-primary">{simulation.maxFee} XLM</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 text-sm text-text-muted animate-pulse">
              Simulating transaction...
            </div>
          )}

          {simulation && (
            <div className="border border-border-primary rounded-xl overflow-hidden">
              <button 
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex w-full items-center justify-between bg-background-secondary/30 p-3 text-sm font-medium text-text-primary hover:bg-background-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-axion-500/50"
                aria-expanded={showDetails}
                aria-controls="technical-details"
              >
                <span>Technical Details</span>
                <svg
                  className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDetails && (
                <div id="technical-details" className="p-3 bg-background-secondary/10 space-y-2 border-t border-border-primary text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">CPU Instructions</span>
                    <span className="text-text-primary font-mono">{simulation.cpuInstructions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">RAM Bytes</span>
                    <span className="text-text-primary font-mono">{simulation.ramBytes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Ledger Entries</span>
                    <span className="text-text-primary font-mono">{simulation.ledgerEntries}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="flex-1 rounded-xl border border-border-primary bg-transparent px-4 py-3 text-sm font-medium text-text-primary hover:bg-background-secondary/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!simulation || isConfirming}
            className="flex-1 rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 hover:bg-axion-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isConfirming ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Confirming...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
