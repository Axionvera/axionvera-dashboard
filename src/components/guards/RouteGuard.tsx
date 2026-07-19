/**
 * @module components/guards/RouteGuard
 *
 * HOC and component for protecting routes based on roles and permissions.
 * Handles unauthorized access by redirecting or showing error messages.
 */

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import { useRBAC } from "@/contexts/RBACContext";
import { UserRole, Permission, RouteAccess } from "@/types/rbac";
import { getRouteAccess } from "@/permissions/routes";
import { validateNavigationTransition } from "@/navigation/stateMachine";
import { canAccessRoute } from "@/permissions/rbac";

interface RouteGuardProps {
  /** Content to render if access is granted */
  children: ReactNode;
  /** Minimum role required */
  minRole?: UserRole;
  /** Required permissions */
  permissions?: Permission[];
  /** Redirect path on unauthorized access */
  redirectTo?: string;
  /** Show loading state while checking permissions */
  loadingComponent?: ReactNode;
  /** Show when access is denied (instead of redirecting) */
  fallback?: ReactNode;
}

/**
 * Component that protects routes based on role and permission requirements.
 *
 * @example
 * // Protect with minimum role
 * <RouteGuard minRole={UserRole.ADMIN}>
 *   <AdminDashboard />
 * </RouteGuard>
 *
 * @example
 * // Protect with permissions
 * <RouteGuard permissions={[Permission.VIEW_ANALYTICS, Permission.EXPORT_ANALYTICS]}>
 *   <AnalyticsPage />
 * </RouteGuard>
 *
 * @example
 * // Custom redirect
 * <RouteGuard minRole={UserRole.POWER_USER} redirectTo="/upgrade">
 *   <PremiumFeatures />
 * </RouteGuard>
 */
export function RouteGuard({
  children,
  minRole,
  permissions = [],
  redirectTo = "/",
  loadingComponent = <RouteGuardLoading />,
  fallback,
}: RouteGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useRBAC();

  // Build route config from props
  const routeConfig: RouteAccess = {
    path: router.pathname,
    minRole: minRole ?? UserRole.USER,
    permissions,
  };

  const transition = validateNavigationTransition("public", {
    pathname: router.pathname,
    user,
    isAuthenticated,
    routeAccess: routeConfig,
  });
  useEffect(() => {
    if (!transition.allowed && !fallback) {
      router.push(transition.redirectTo ?? redirectTo);
    }
  }, [fallback, redirectTo, router, transition.allowed, transition.redirectTo]);

  // Show loading while checking auth
  if (!isAuthenticated && minRole && minRole !== UserRole.GUEST) {
    return <>{loadingComponent}</>;
  }

  // Access denied
  if (!transition.allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null; // Will redirect via useEffect
  }

  // Access granted
  return <>{children}</>;
}

/**
 * Default loading component for RouteGuard.
 */
function RouteGuardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Checking permissions...</p>
      </div>
    </div>
  );
}

/**
 * HOC to protect a page component with route guards.
 * Automatically uses route configuration from ROUTE_ACCESS_CONFIG.
 *
 * @example
 * export default withRouteGuard(AnalyticsPage);
 *
 * @example
 * // With custom options
 * export default withRouteGuard(AdminPage, {
 *   redirectTo: "/unauthorized",
 *   fallback: <AccessDenied />
 * });
 */
export function withRouteGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    loadingComponent?: ReactNode;
    fallback?: ReactNode;
  }
) {
  const GuardedComponent = (props: P) => {
    const router = useRouter();
    const { user, isAuthenticated } = useRBAC();
    const fallback = options?.fallback;
    const loadingComponent = options?.loadingComponent;
    const redirectTo = options?.redirectTo ?? "/";

    // Hoist option references for stable closures
    const redirectPath = options?.redirectTo ?? "/";
    const fallback = options?.fallback;

    // Get route config from ROUTE_ACCESS_CONFIG
    const routeConfig = getRouteAccess(router.pathname);
    const transition = validateNavigationTransition("public", {
      pathname: router.pathname,
      user,
      isAuthenticated,
      routeAccess: routeConfig,
    });

    useEffect(() => {
      if (!transition.allowed && !fallback) {
        router.push(transition.redirectTo ?? redirectTo);
      }
    }, [fallback, redirectTo, router, transition.allowed, transition.redirectTo]);

    // If no config found, allow access (default behavior)
    if (!routeConfig) {
      return <Component {...props} />;
    }

    // Access denied
    if (!transition.allowed) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return loadingComponent ? <>{loadingComponent}</> : null;
    }

    // Access granted
    return <Component {...props} />;
  };

  GuardedComponent.displayName = `withRouteGuard(${Component.displayName || Component.name})`;

  return GuardedComponent;
}

/**
 * Access denied fallback component.
 */
export function AccessDenied({ message }: { message?: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md px-6">
        <div className="mb-6">
          <svg
            className="w-20 h-20 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || "You don't have permission to access this page."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
