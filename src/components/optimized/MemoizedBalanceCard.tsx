/**
 * @module components/optimized/MemoizedBalanceCard
 *
 * Performance-optimized version of BalanceCard with memoization.
 * Prevents unnecessary re-renders when props haven't changed.
 */

import React, { memo } from "react";
import { BalanceCard } from "@/features/vault";

/**
 * Props comparison function for React.memo.
 * Only re-render if relevant props actually change.
 */
function arePropsEqual(
  prevProps: React.ComponentProps<typeof BalanceCard>,
  nextProps: React.ComponentProps<typeof BalanceCard>
): boolean {
  return (
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.publicKey === nextProps.publicKey &&
    prevProps.balance === nextProps.balance &&
    prevProps.rewards === nextProps.rewards &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error
    // onRefresh callback is stable, no need to check
  );
}

/**
 * Memoized BalanceCard component.
 * Prevents re-renders when props haven't changed.
 */
export const MemoizedBalanceCard = memo(BalanceCard, arePropsEqual);

MemoizedBalanceCard.displayName = "MemoizedBalanceCard";
