/**
 * @module permissions/routes
 *
 * Route access control configuration for the application.
 * Defines which roles can access which routes.
 */

import { UserRole, Permission, RouteAccess } from "@/types/rbac";

/**
 * Route access configuration for all application routes.
 * Routes are checked in order, first match wins.
 */
export const ROUTE_ACCESS_CONFIG: RouteAccess[] = [
  // ── Public Routes ───────────────────────────────────────────────────────
  {
    path: "/",
    minRole: UserRole.GUEST,
    allowGuest: true,
  },
  {
    path: "/404",
    minRole: UserRole.GUEST,
    allowGuest: true,
  },
  {
    path: "/500",
    minRole: UserRole.GUEST,
    allowGuest: true,
  },

  // ── Dashboard ───────────────────────────────────────────────────────────
  {
    path: "/dashboard",
    minRole: UserRole.USER,
    permissions: [Permission.VIEW_BALANCE, Permission.VIEW_VAULT],
  },

  // ── Analytics ───────────────────────────────────────────────────────────
  {
    path: "/analytics",
    minRole: UserRole.POWER_USER,
    permissions: [Permission.VIEW_ANALYTICS],
  },

  // ── Governance ──────────────────────────────────────────────────────────
  {
    path: "/governance",
    minRole: UserRole.USER,
    permissions: [Permission.VIEW_PROPOSALS],
  },
  {
    path: "/governance/create",
    minRole: UserRole.POWER_USER,
    permissions: [Permission.CREATE_PROPOSALS],
  },
  {
    path: "/governance/manage",
    minRole: UserRole.ADMIN,
    permissions: [Permission.MANAGE_PROPOSALS],
  },

  // ── Monitoring ──────────────────────────────────────────────────────────
  {
    path: "/monitoring",
    minRole: UserRole.ADMIN,
    permissions: [Permission.VIEW_MONITORING],
  },

  // ── Profile ─────────────────────────────────────────────────────────────
  {
    path: "/profile",
    minRole: UserRole.USER,
    permissions: [Permission.VIEW_PROFILE],
  },

  // ── Admin Panel ─────────────────────────────────────────────────────────
  {
    path: "/admin",
    minRole: UserRole.ADMIN,
    permissions: [Permission.ACCESS_ADMIN_PANEL],
  },
  {
    path: "/admin/users",
    minRole: UserRole.ADMIN,
    permissions: [Permission.MANAGE_USERS],
  },
  {
    path: "/admin/roles",
    minRole: UserRole.SUPER_ADMIN,
    permissions: [Permission.MANAGE_ROLES],
  },
  {
    path: "/admin/system",
    minRole: UserRole.SUPER_ADMIN,
    permissions: [Permission.SYSTEM_CONFIGURATION],
  },
];

/**
 * Find route access config for a given path.
 * Uses simple pattern matching (supports wildcards).
 *
 * @param pathname - The route path to check
 * @returns Route access config or undefined if not found
 */
export function getRouteAccess(pathname: string): RouteAccess | undefined {
  return ROUTE_ACCESS_CONFIG.find((route) => {
    // Exact match
    if (route.path === pathname) return true;

    // Wildcard match (e.g., "/admin/*" matches "/admin/users")
    if (route.path.endsWith("/*")) {
      const basePath = route.path.slice(0, -2);
      return pathname.startsWith(basePath);
    }

    return false;
  });
}

/**
 * Check if a path is a public route (allows guests).
 *
 * @param pathname - The route path to check
 * @returns True if the route allows guest access
 */
export function isPublicRoute(pathname: string): boolean {
  const routeAccess = getRouteAccess(pathname);
  return routeAccess?.allowGuest === true;
}

/**
 * Check if a path requires authentication.
 *
 * @param pathname - The route path to check
 * @returns True if the route requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  const routeAccess = getRouteAccess(pathname);
  if (!routeAccess) return true; // Default to requiring auth
  return !routeAccess.allowGuest;
}

/**
 * Get the minimum role required for a route.
 *
 * @param pathname - The route path to check
 * @returns Minimum role required or GUEST if not configured
 */
export function getMinimumRole(pathname: string): UserRole {
  const routeAccess = getRouteAccess(pathname);
  return routeAccess?.minRole ?? UserRole.GUEST;
}

/**
 * Check if a path is registered in the route table.
 *
 * @param pathname - The route path to check
 * @returns True if the route exists in route access config
 */
export function isKnownRoute(pathname: string): boolean {
  return Boolean(getRouteAccess(pathname));
}
