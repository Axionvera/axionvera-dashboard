/**
 * @module components/optimized/MemoizedAnalyticsDashboard
 *
 * Performance-optimized version of AnalyticsDashboard with memoization.
 */

import React, { memo } from "react";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

/**
 * Since AnalyticsDashboard uses hooks (useWalletContext, useVault, useAnalytics)
 * internally, we should be careful with memoization if it doesn't take props.
 * However, the original AnalyticsDashboard DOES NOT take any props.
 * To make it truly optimized, we might want to refactor it to take props,
 * but for now we'll create a memoized wrapper that we can use in the dashboard.
 */
export const MemoizedAnalyticsDashboard = memo(AnalyticsDashboard);
MemoizedAnalyticsDashboard.displayName = "MemoizedAnalyticsDashboard";
