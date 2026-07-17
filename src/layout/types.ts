export type DashboardBreakpoint = "mobile" | "tablet" | "desktop";

export interface DashboardPlacement {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardLayoutState {
  version: 1;
  mobile: DashboardPlacement[];
  tablet: DashboardPlacement[];
  desktop: DashboardPlacement[];
}

export interface DashboardWidgetDefinition {
  id: string;
  title: string;
  description?: string;
  size: "small" | "wide" | "large";
}
