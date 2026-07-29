/**
 * @module components/layout
 *
 * The application shell: navigation, sidebar and dashboard layout scaffolding.
 * This is a composition root, so it is the one place under `components/` that
 * may compose feature modules.
 */

export { default as Navbar } from "./Navbar";
export { default as Sidebar } from "./Sidebar";
export { RoleAwareNav, mainNavItems, adminNavItems, type NavItem } from "./RoleAwareNav";
export * from "./DashboardLayoutManager";
export * from "./DashboardWidgetCard";
