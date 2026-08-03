import { canAccessRoute } from "@/permissions/rbac";
import { getRouteAccess, isKnownRoute } from "@/permissions/routes";
import { Permission, RouteAccess, UserWithRole } from "@/types/rbac";

export type NavigationState =
  | "public"
  | "authenticating"
  | "authenticated"
  | "featureBlocked"
  | "notFound"
  | "accessDenied";

export type NavigationEvent =
  | "visitPublicRoute"
  | "requestProtectedRoute"
  | "authenticate"
  | "authorize"
  | "blockForFeature"
  | "denyAccess"
  | "missingRoute"
  | "logout";

export type FeatureKey = "dashboard" | "analytics" | "governance" | "monitoring" | "profile" | "admin";

export interface FeatureGate {
  key: FeatureKey;
  enabled: boolean;
  paths: string[];
  reason?: string;
}

export interface NavigationContext {
  pathname: string;
  user: UserWithRole | null;
  isAuthenticated: boolean;
  features?: Partial<Record<FeatureKey, boolean>>;
  routeAccess?: RouteAccess;
}

export interface NavigationTransitionResult {
  allowed: boolean;
  from: NavigationState;
  to: NavigationState;
  event: NavigationEvent;
  pathname: string;
  redirectTo?: string;
  reason?: string;
  routeAccess?: RouteAccess;
  missingPermissions?: Permission[];
  feature?: FeatureKey;
}

export const DEFAULT_FEATURE_GATES: FeatureGate[] = [
  { key: "dashboard", enabled: true, paths: ["/dashboard"] },
  { key: "analytics", enabled: true, paths: ["/analytics"] },
  { key: "governance", enabled: true, paths: ["/governance", "/governance/*"] },
  { key: "monitoring", enabled: true, paths: ["/monitoring"] },
  { key: "profile", enabled: true, paths: ["/profile"] },
  { key: "admin", enabled: true, paths: ["/admin", "/admin/*"] },
];

export const NAVIGATION_TRANSITIONS: Record<NavigationState, NavigationEvent[]> = {
  public: ["visitPublicRoute", "requestProtectedRoute", "authenticate", "missingRoute"],
  authenticating: ["authorize", "denyAccess", "logout", "blockForFeature", "missingRoute"],
  authenticated: ["visitPublicRoute", "requestProtectedRoute", "authorize", "denyAccess", "logout", "blockForFeature", "missingRoute"],
  featureBlocked: ["visitPublicRoute", "requestProtectedRoute", "authorize", "logout", "missingRoute"],
  notFound: ["visitPublicRoute", "requestProtectedRoute", "logout"],
  accessDenied: ["visitPublicRoute", "requestProtectedRoute", "authorize", "logout", "missingRoute"],
};

function matchesPath(pattern: string, pathname: string): boolean {
  if (pattern === pathname) return true;
  if (pattern.endsWith("/*")) return pathname.startsWith(pattern.slice(0, -2));
  return false;
}

function featureForPath(pathname: string, overrides?: NavigationContext["features"]): FeatureGate | undefined {
  return DEFAULT_FEATURE_GATES.map((gate) => ({
    ...gate,
    enabled: overrides?.[gate.key] ?? gate.enabled,
  })).find((gate) => gate.paths.some((path) => matchesPath(path, pathname)));
}

export function deriveNavigationState(context: NavigationContext): NavigationState {
  const routeAccess = context.routeAccess ?? getRouteAccess(context.pathname);
  if (!routeAccess && !isKnownRoute(context.pathname)) return "notFound";
  if (routeAccess?.allowGuest) return "public";
  if (!context.isAuthenticated || !context.user) return "authenticating";
  const feature = featureForPath(context.pathname, context.features);
  if (feature && !feature.enabled) return "featureBlocked";
  const access = routeAccess ? canAccessRoute(context.user, routeAccess) : { granted: true };
  return access.granted ? "authenticated" : "accessDenied";
}

export function validateNavigationTransition(
  from: NavigationState,
  context: NavigationContext,
): NavigationTransitionResult {
  const routeAccess = context.routeAccess ?? getRouteAccess(context.pathname);

  if (!routeAccess && !isKnownRoute(context.pathname)) {
    return buildResult(from, "notFound", "missingRoute", context.pathname, false, { reason: "Route is not registered", redirectTo: "/404" });
  }

  if (routeAccess?.allowGuest) {
    return buildResult(from, "public", "visitPublicRoute", context.pathname, true, { routeAccess });
  }

  if (!context.isAuthenticated || !context.user) {
    return buildResult(from, "authenticating", "requestProtectedRoute", context.pathname, false, {
      reason: "Authentication required",
      redirectTo: "/",
      routeAccess,
    });
  }

  const feature = featureForPath(context.pathname, context.features);
  if (feature && !feature.enabled) {
    return buildResult(from, "featureBlocked", "blockForFeature", context.pathname, false, {
      reason: feature.reason ?? `${feature.key} feature is disabled`,
      redirectTo: "/dashboard",
      routeAccess,
      feature: feature.key,
    });
  }

  const access = routeAccess ? canAccessRoute(context.user, routeAccess) : { granted: true };
  if (!access.granted) {
    return buildResult(from, "accessDenied", "denyAccess", context.pathname, false, {
      reason: access.reason,
      redirectTo: "/",
      routeAccess,
      missingPermissions: access.missingPermissions,
    });
  }

  return buildResult(from, "authenticated", "authorize", context.pathname, true, { routeAccess });
}

function buildResult(
  from: NavigationState,
  to: NavigationState,
  event: NavigationEvent,
  pathname: string,
  routeAllowed: boolean,
  extras: Partial<NavigationTransitionResult> = {},
): NavigationTransitionResult {
  const transitionAllowed = NAVIGATION_TRANSITIONS[from].includes(event);
  return {
    allowed: routeAllowed && transitionAllowed,
    from,
    to: transitionAllowed ? to : from,
    event,
    pathname,
    ...extras,
    reason: transitionAllowed ? extras.reason : `Invalid navigation transition: ${from} cannot handle ${event}`,
  };
}
