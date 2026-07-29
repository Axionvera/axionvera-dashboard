import type { RewardPerformance, VaultParticipationMetrics } from "@/utils/contractHelpers";
import { formatAmount } from "@/utils/contractHelpers";
import { MetricCard } from "@/design-system";

type AnalyticsMetricsProps = {
  rewardPerformance: RewardPerformance;
  participationMetrics: VaultParticipationMetrics;
};

const iconClassName = "h-5 w-5";

const icons = {
  rewards: (
    <svg className={`${iconClassName} text-axion-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  heart: (
    <svg className={`${iconClassName} text-emerald-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  chart: (
    <svg className={`${iconClassName} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  calendar: (
    <svg className={`${iconClassName} text-purple-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  withdrawals: (
    <svg className={`${iconClassName} text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

export default function AnalyticsMetrics({
  rewardPerformance, participationMetrics }: AnalyticsMetricsProps) {
  const metrics = [
    { label: "Total Rewards Earned", value: formatAmount(rewardPerformance.totalRewardsEarned), icon: icons.rewards, description: `Average rate: ${rewardPerformance.averageRewardRate}%` },
    { label: "Last Reward", value: rewardPerformance.lastRewardDate ? new Date(rewardPerformance.lastRewardDate).toLocaleDateString() : "No rewards yet", icon: icons.heart },
    { label: "Net Deposits", value: formatAmount(participationMetrics.netDeposits), icon: icons.chart },
    { label: "Active Days", value: participationMetrics.activeDays, icon: icons.calendar, description: `${participationMetrics.transactionCount} total transactions` },
    { label: "Total Deposits", value: formatAmount(participationMetrics.totalDeposits), icon: icons.rewards },
    { label: "Total Withdrawals", value: formatAmount(participationMetrics.totalWithdrawals), icon: icons.withdrawals },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} className="bg-white dark:bg-slate-950/80" />
      ))}
    </div>
  );
}
