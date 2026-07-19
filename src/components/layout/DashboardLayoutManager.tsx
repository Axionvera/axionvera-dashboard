import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createDefaultLayout, loadDashboardLayout, normalizeDashboardLayout, reorderLayoutPlacements, resizeLayoutPlacement, saveDashboardLayout } from "@/layout/manager";
import { DashboardLayoutState, DashboardPlacement } from "@/layout/types";

interface DashboardLayoutManagerProps {
  widgetIds: string[];
  children: (props: {
    placements: DashboardPlacement[];
    activeBreakpoint: "mobile" | "tablet" | "desktop";
    onReorder: (sourceId: string, targetId: string) => void;
    onResize: (widgetId: string, width: number) => void;
  }) => ReactNode;
}

const breakpointOrder = ["mobile", "tablet", "desktop"] as const;

type Breakpoint = (typeof breakpointOrder)[number];

function resolveBreakpoint(width: number): Breakpoint {
  if (width >= 1024) return "desktop";
  if (width >= 640) return "tablet";
  return "mobile";
}

function createInitialLayout(widgetIds: string[]): DashboardLayoutState {
  return normalizeDashboardLayout(null, widgetIds);
}

export function DashboardLayoutManager({ widgetIds, children }: DashboardLayoutManagerProps) {
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>("desktop");
  const [layout, setLayout] = useState<DashboardLayoutState>(() => createInitialLayout(widgetIds));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateBreakpoint = () => {
      const resolved = resolveBreakpoint(window.innerWidth);
      setActiveBreakpoint(resolved);
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  useEffect(() => {
    const normalized = normalizeDashboardLayout(loadDashboardLayout(widgetIds), widgetIds);
    setLayout(normalized);
  }, [widgetIds]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    saveDashboardLayout(layout);
  }, [layout]);

  const placements = layout[activeBreakpoint];

  const onReorder = (sourceId: string, targetId: string) => {
    setLayout((current) => ({
      ...current,
      [activeBreakpoint]: reorderLayoutPlacements(
        current[activeBreakpoint],
        sourceId,
        targetId,
        0,
        activeBreakpoint === "mobile" ? 1 : activeBreakpoint === "tablet" ? 2 : 4
      ),
    }));
  };

  const onResize = (widgetId: string, width: number) => {
    setLayout((current) => ({
      ...current,
      [activeBreakpoint]: resizeLayoutPlacement(current[activeBreakpoint], widgetId, width),
    }));
  };

  const renderProps = useMemo(() => ({
    placements,
    activeBreakpoint,
    onReorder,
    onResize,
  }), [activeBreakpoint, placements]);

  return <>{children(renderProps)}</>;
}
