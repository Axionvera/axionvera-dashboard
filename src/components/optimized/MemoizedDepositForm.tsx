/**
 * @module components/optimized/MemoizedDepositForm
 *
 * Performance-optimized version of DepositForm with memoization.
 */

import React, { memo } from "react";
import { DepositForm } from "@/features/vault";

function arePropsEqual(
  prevProps: React.ComponentProps<typeof DepositForm>,
  nextProps: React.ComponentProps<typeof DepositForm>
): boolean {
  return (
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.status === nextProps.status &&
    prevProps.statusMessage === nextProps.statusMessage &&
    prevProps.transactionHash === nextProps.transactionHash &&
    prevProps.walletAddress === nextProps.walletAddress &&
    prevProps.walletBalance === nextProps.walletBalance
  );
}

export const MemoizedDepositForm = memo(DepositForm, arePropsEqual);
MemoizedDepositForm.displayName = "MemoizedDepositForm";
