import {
  createDefaultLayout,
  normalizeDashboardLayout,
  reorderLayoutPlacements,
  resizeLayoutPlacement,
  loadDashboardLayout,
  saveDashboardLayout,
  type DashboardLayoutState,
} from "@/layout";

describe("dashboard layout manager", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists a reordered layout and restores it between sessions", () => {
    const ids = ["balance", "deposit", "analytics"];
    const layout = createDefaultLayout(ids, "desktop");
    const reordered = reorderLayoutPlacements(layout, "analytics", "balance", 3);

    const persisted: DashboardLayoutState = {
      version: 1,
      mobile: layout,
      tablet: layout,
      desktop: reordered,
    };

    saveDashboardLayout(persisted);
    const restored = loadDashboardLayout(ids);

    expect(restored.desktop[0].id).toBe("analytics");
    expect(restored.desktop[1].id).toBe("balance");
    expect(restored.desktop[2].id).toBe("deposit");
  });

  it("recovers gracefully from invalid layouts", () => {
    const invalidLayout = {
      version: 1,
      mobile: [
        { id: "balance", x: 0, y: 0, w: 0, h: 1 },
        { id: "deposit", x: 2, y: 0, w: 2, h: 1 },
      ],
      tablet: null,
      desktop: [
        { id: "missing-widget", x: 0, y: 0, w: 1, h: 1 },
      ],
    };

    const normalized = normalizeDashboardLayout(invalidLayout as any, ["balance", "deposit", "analytics"]);

    expect(normalized.mobile[0].w).toBeGreaterThan(0);
    expect(normalized.desktop.some((item) => item.id === "analytics")).toBe(true);
    expect(normalized.desktop.every((item) => item.w > 0 && item.h > 0)).toBe(true);
  });

  it("resizes widgets within the current breakpoint bounds", () => {
    const layout = createDefaultLayout(["balance", "deposit"], "tablet");
    const resized = resizeLayoutPlacement(layout, "balance", 2);

    const item = resized.find((entry) => entry.id === "balance");

    expect(item?.w).toBe(2);
    expect(item?.w).toBeLessThanOrEqual(2);
  });
});
