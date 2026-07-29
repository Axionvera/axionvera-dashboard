import { DashboardBreakpoint, DashboardLayoutState, DashboardPlacement } from "./types";

const STORAGE_KEY = "axionvera-dashboard-layout";
const MAX_COLUMNS = 4;

const breakpointBounds: Record<DashboardBreakpoint, { maxCols: number; minItemWidth: number }> = {
  mobile: { maxCols: 1, minItemWidth: 1 },
  tablet: { maxCols: 2, minItemWidth: 1 },
  desktop: { maxCols: 4, minItemWidth: 1 },
};

const DEFAULT_LAYOUT_BY_BREAKPOINT: Record<DashboardBreakpoint, Array<[string, number, number, number, number]>> = {
  mobile: [
    ["balance", 0, 0, 1, 1],
    ["deposit", 0, 1, 1, 1],
    ["analytics", 0, 2, 1, 1],
  ],
  tablet: [
    ["balance", 0, 0, 2, 1],
    ["deposit", 0, 1, 2, 1],
    ["analytics", 0, 2, 2, 1],
  ],
  desktop: [
    ["balance", 0, 0, 2, 1],
    ["deposit", 2, 0, 2, 1],
    ["analytics", 0, 1, 4, 2],
  ],
};

export function createDefaultLayout(widgetIds: string[], breakpoint: DashboardBreakpoint): DashboardPlacement[] {
  const base = DEFAULT_LAYOUT_BY_BREAKPOINT[breakpoint].filter(([id]) => widgetIds.includes(id));
  const placements = base.map(([id, x, y, w, h]) => ({ id, x, y, w, h }));
  const remaining = widgetIds.filter((id) => !placements.some((placement) => placement.id === id));

  remaining.forEach((id, index) => {
    placements.push({
      id,
      x: index % breakpointBounds[breakpoint].maxCols,
      y: Math.floor(index / breakpointBounds[breakpoint].maxCols),
      w: 1,
      h: 1,
    });
  });

  return placements;
}

export function normalizeDashboardLayout(
  input: Partial<DashboardLayoutState> | null | undefined,
  widgetIds: string[]
): DashboardLayoutState {
  const fallback = {
    version: 1,
    mobile: createDefaultLayout(widgetIds, "mobile"),
    tablet: createDefaultLayout(widgetIds, "tablet"),
    desktop: createDefaultLayout(widgetIds, "desktop"),
  };

  const normalizeBreakpoint = (breakpoint: DashboardBreakpoint): DashboardPlacement[] => {
    const maxCols = breakpointBounds[breakpoint].maxCols;
    const source = input?.[breakpoint] ?? fallback[breakpoint];
    const validItems = Array.isArray(source)
      ? source.filter((item) => item && typeof item.id === "string")
      : [];

    const normalized = validItems.map((item) => {
      const safeW = Math.max(1, Math.min(Math.floor(item.w ?? 1), maxCols));
      const safeH = Math.max(1, Math.floor(item.h ?? 1));
      const safeX = Math.max(0, Math.min(Math.floor(item.x ?? 0), maxCols - safeW));
      const safeY = Math.max(0, Math.floor(item.y ?? 0));
      return { ...item, x: safeX, y: safeY, w: safeW, h: safeH };
    });

    const knownIds = new Set(widgetIds);
    const kept = normalized.filter((item) => knownIds.has(item.id));
    const missing = widgetIds.filter((id) => !kept.some((item) => item.id === id));

    const next = [...kept];
    missing.forEach((id, index) => {
      next.push({
        id,
        x: index % maxCols,
        y: Math.floor(index / maxCols),
        w: 1,
        h: 1,
      });
    });

    return next;
  };

  return {
    version: 1,
    mobile: normalizeBreakpoint("mobile"),
    tablet: normalizeBreakpoint("tablet"),
    desktop: normalizeBreakpoint("desktop"),
  };
}

export function reorderLayoutPlacements(
  placements: DashboardPlacement[],
  sourceId: string,
  targetId: string,
  targetIndex: number,
  maxCols: number = 4
): DashboardPlacement[] {
  const next = placements.map((placement) => ({ ...placement }));
  const sourceIndex = next.findIndex((placement) => placement.id === sourceId);
  const targetIndexInLayout = next.findIndex((placement) => placement.id === targetId);

  if (sourceIndex === -1 || targetIndexInLayout === -1) {
    return next;
  }

  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndexInLayout, 0, moved);

  return next.map((placement, index) => ({
    ...placement,
    x: index % maxCols,
    y: Math.floor(index / maxCols),
  }));
}

export function resizeLayoutPlacement(
  placements: DashboardPlacement[],
  widgetId: string,
  width: number
): DashboardPlacement[] {
  const maxCols = 4;
  const normalizedWidth = Math.max(1, Math.min(width, maxCols));

  return placements.map((placement) => {
    if (placement.id !== widgetId) {
      return placement;
    }

    return { ...placement, w: normalizedWidth };
  });
}

export function loadDashboardLayout(widgetIds: string[]): DashboardLayoutState {
  if (typeof window === "undefined") {
    return normalizeDashboardLayout(null, widgetIds);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizeDashboardLayout(null, widgetIds);
    }

    const parsed = JSON.parse(raw) as Partial<DashboardLayoutState>;
    return normalizeDashboardLayout(parsed, widgetIds);
  } catch {
    return normalizeDashboardLayout(null, widgetIds);
  }
}

export function saveDashboardLayout(layout: DashboardLayoutState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Ignore persistence errors and fall back to in-memory state.
  }
}
