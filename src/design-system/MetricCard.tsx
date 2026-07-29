import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  compact?: boolean;
}

export function MetricCard({
  label,
  value,
  icon,
  description,
  compact = false,
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-primary bg-background-primary/30 shadow-sm transition-all duration-300",
        compact ? "p-4" : "p-6",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-sm text-text-muted">
        {icon ? <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className={cn("font-semibold text-text-primary", compact ? "mt-1 text-xl" : "mt-2 text-2xl")}>
        {value}
      </div>
      {description ? <div className="mt-1 text-xs text-text-muted">{description}</div> : null}
    </div>
  );
}
