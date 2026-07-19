import { type ReactNode } from "react";
import { DashboardPlacement } from "@/layout/types";
import { GripVertical, MoveHorizontal } from "lucide-react";

interface DashboardWidgetCardProps {
  widgetId: string;
  title: string;
  description?: string;
  placement: DashboardPlacement;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDrop?: () => void;
  onResize?: (width: number) => void;
  children: ReactNode;
}

export function DashboardWidgetCard({
  widgetId,
  title,
  description,
  placement,
  isDragging = false,
  onDragStart,
  onDrop,
  onResize,
  children,
}: DashboardWidgetCardProps) {
  return (
    <section
      data-testid={`widget-${widgetId}`}
      className={`rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 shadow-lg shadow-black/20 transition-all ${isDragging ? "opacity-60" : "opacity-100"}`}
      style={{ gridColumn: `span ${placement.w}`, gridRow: `span ${placement.h}` }}
      draggable
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          {description ? <p className="text-xs text-slate-400">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-600 p-1 text-slate-300 transition hover:bg-slate-800"
            title="Drag widget"
            onClick={onDragStart}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-600 p-1 text-slate-300 transition hover:bg-slate-800"
            title="Resize widget"
            onClick={() => onResize?.(placement.w === 1 ? 2 : 1)}
          >
            <MoveHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="min-h-[240px]">{children}</div>
    </section>
  );
}
