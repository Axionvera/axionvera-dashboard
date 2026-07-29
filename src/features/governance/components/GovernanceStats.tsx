import { type GovernanceStats as GovernanceStatsType } from "@/utils/contractHelpersGovernance";
import { Skeleton } from "@/components/ui/Skeleton";

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
        <div
          key={item.label}
          className="rounded-xl border border-border-primary bg-background-primary p-4"
        >
          <p className="text-xs text-text-muted">{item.label}</p>
          <p className="mt-1 text-xl font-bold text-text-primary">{item.value}</p>
        </div>
      ))}
    </div>
  );
}