import { type GovernanceStats as GovernanceStatsType } from "@/utils/contractHelpersGovernance";
import { Skeleton } from "@/components/Skeleton";
import { MetricCard } from "@/design-system";

interface GovernanceStatsProps {
  stats: GovernanceStatsType | null;
  isLoading: boolean;
}

export default function GovernanceStats({ stats, isLoading }: GovernanceStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  const items = [
    { label: "Total Proposals", value: String(stats.totalProposals) },
    { label: "Active Proposals", value: String(stats.activeProposals) },
    { label: "Total Votes Cast", value: String(stats.totalVotesCast) },
    { label: "Participation Rate", value: `${stats.participationRate}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <MetricCard
          key={item.label}
          label={item.label}
          value={item.value}
          compact
          className="rounded-xl bg-background-primary shadow-none"
        />
      ))}
    </div>
  );
}