/**
 * @module components/optimized/MemoizedTransactionHistory
 *
 * Performance-optimized version of TransactionHistory with memoization.
 */

import React, { memo } from "react";
import { TransactionHistory } from "@/features/transactions";

function arePropsEqual(
  prevProps: React.ComponentProps<typeof TransactionHistory>,
  nextProps: React.ComponentProps<typeof TransactionHistory>
): boolean {
  return (
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.publicKey === nextProps.publicKey &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isClaiming === nextProps.isClaiming &&
    // Shallow comparison of transactions array - might be enough if context updates it properly
    prevProps.transactions === nextProps.transactions
  );
}

export const MemoizedTransactionHistory = memo(TransactionHistory, arePropsEqual);
MemoizedTransactionHistory.displayName = "MemoizedTransactionHistory";
