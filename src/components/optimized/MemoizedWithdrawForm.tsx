/**
 * @module components/optimized/MemoizedWithdrawForm
 *
 * Performance-optimized version of WithdrawForm with memoization.
 */

import React, { memo } from "react";
import { WithdrawForm } from "@/features/vault";

function arePropsEqual(
  prevProps: React.ComponentProps<typeof WithdrawForm>,
  nextProps: React.ComponentProps<typeof WithdrawForm>
): boolean {
  return (
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    prevProps.balance === nextProps.balance &&
    prevProps.status === nextProps.status &&
    prevProps.statusMessage === nextProps.statusMessage &&
    prevProps.transactionHash === nextProps.transactionHash &&
    prevProps.walletAddress === nextProps.walletAddress
  );
}

export const MemoizedWithdrawForm = memo(WithdrawForm, arePropsEqual);
MemoizedWithdrawForm.displayName = "MemoizedWithdrawForm";
