import React from "react";

interface ConfirmTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;

  actionType: "Deposit" | "Withdraw";
  assetAmount: string;
  networkFee: string;
  contractId: string;
}

const ConfirmTransactionModal: React.FC<ConfirmTransactionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  assetAmount,
  networkFee,
  contractId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Confirm Transaction
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Action</span>
            <span className="font-medium">{actionType}</span>
          </div>

          <div className="flex justify-between">
            <span>Amount</span>
            <span className="font-medium">{assetAmount}</span>
          </div>

          <div className="flex justify-between">
            <span>Network Fee</span>
            <span className="font-medium">{networkFee}</span>
          </div>

          <div className="flex flex-col">
            <span>Contract ID</span>
            <span className="font-mono text-xs break-all">
              {contractId}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white"
          >
            Confirm & Sign
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmTransactionModal;
