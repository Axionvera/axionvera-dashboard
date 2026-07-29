import type { RewardPerformance, VaultParticipationMetrics } from "@/utils/contractHelpers";
import { formatAmount } from "@/utils/contractHelpers";

type AnalyticsMetricsProps = {
  rewardPerformance: RewardPerformance;
  participationMetrics: VaultParticipationMetrics;
};

export default function AnalyticsMetrics({
  rewardPerformance, participationMetrics }: AnalyticsMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Reward Performance Cards */}
      <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <svg className="h-5 w-5 text-axion-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Total Rewards Earned
        </div>
        <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          {formatAmount(rewardPerformance.totalRewardsEarned)}
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Average rate: {rewardPerformance.averageRewardRate}%
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Last Reward
        </div>
        <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          {rewardPerformance.lastRewardDate 
            ? new Date(rewardPerformance.lastRewardDate).toLocaleDateString() 
            : "No rewards yet"}
        </div>
      </div>

      {/* Participation Metrics Cards */}
      <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Net Deposits
        </div>
        <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          {formatAmount(participationMetrics.netDeposits)}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Active Days
        </div>
        <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          {participationMetrics.activeDays}
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {participationMetrics.transactionCount} total transactions
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Total Deposits
        </div>
        <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          {formatAmount(participationMetrics.totalDeposits)}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Total Withdrawals
        </div>
        <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
          {formatAmount(participationMetrics.totalWithdrawals)}
        </div>
      </div>
    </div>
  );
}
