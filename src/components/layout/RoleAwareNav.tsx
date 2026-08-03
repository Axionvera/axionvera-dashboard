/**
 * @module components/RoleAwareNav
 *
 * Role-aware navigation component that conditionally renders navigation
 * items based on user permissions and roles.
 */

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRBAC } from "@/contexts/RBACContext";
import { Permission, UserRole } from "@/types/rbac";

export interface NavItem {
  /** Display label */
  label: string;
  /** Navigation path */
  href: string;
  /** Icon component (optional) */
  icon?: React.ReactNode;
  /** Required permission(s) */
  permission?: Permission;
  /** Multiple permissions (all required) */
  permissions?: Permission[];
  /** Minimum role required */
  minRole?: UserRole;
  /** Badge text (optional) */
  badge?: string;
  /** Whether item opens in new tab */
  external?: boolean;
}

interface RoleAwareNavProps {
  /** Navigation items */
  items: NavItem[];
  /** Additional CSS classes */
  className?: string;
  /** Item CSS classes */
  itemClassName?: string;
  /** Active item CSS classes */
  activeClassName?: string;
  /** Orientation */
  orientation?: "horizontal" | "vertical";
}

/**
 * Navigation component that filters items based on user permissions.
 *
 * @example
 * const navItems: NavItem[] = [
 *   { label: "Dashboard", href: "/dashboard", minRole: UserRole.USER },
 *   { label: "Analytics", href: "/analytics", permission: Permission.VIEW_ANALYTICS },
 *   { label: "Admin", href: "/admin", minRole: UserRole.ADMIN, badge: "Admin" },
 * ];
 *
 * <RoleAwareNav items={navItems} />
 */
export function RoleAwareNav({
  items,
  className = "",
  itemClassName = "",
  activeClassName = "",
  orientation = "horizontal",
}: RoleAwareNavProps) {
  const router = useRouter();
  const rbac = useRBAC();

  // Filter items based on permissions
  const visibleItems = items.filter((item) => {
    // Check minimum role
    if (item.minRole && !rbac.hasMinimumRole(item.minRole)) {
      return false;
    }

    // Check single permission
    if (item.permission && !rbac.hasPermission(item.permission)) {
      return false;
    }

    // Check multiple permissions
    if (item.permissions && !rbac.hasAllPermissions(item.permissions)) {
      return false;
    }

    return true;
  });

  const baseItemClasses = itemClassName || "rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors";
  const activeClasses = activeClassName || "bg-slate-100 dark:bg-slate-900/60 font-semibold";

  const navClasses = `${orientation === "horizontal" ? "flex items-center gap-2" : "flex flex-col gap-1"} ${className}`;

  return (
    <nav className={navClasses} aria-label="Navigation">
      {visibleItems.map((item) => {
        const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
        const itemClasses = `${baseItemClasses} ${isActive ? activeClasses : ""}`;

        if (item.external) {
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={itemClasses}
            >
              {item.icon && <span className="inline-flex mr-2">{item.icon}</span>}
              {item.label}
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                  {item.badge}
                </span>
              )}
              <span className="sr-only">(opens in new tab)</span>
            </a>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={itemClasses}
            aria-current={isActive ? "page" : undefined}
          >
            {item.icon && <span className="inline-flex mr-2">{item.icon}</span>}
            {item.label}
            {item.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Pre-configured navigation items for the main application.
 */
export const mainNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    minRole: UserRole.USER,
  },
  {
    label: "Analytics",
    href: "/analytics",
    permission: Permission.VIEW_ANALYTICS,
  },
  {
    label: "Governance",
    href: "/governance",
    permission: Permission.VIEW_PROPOSALS,
  },
  {
    label: "Monitoring",
    href: "/monitoring",
    minRole: UserRole.ADMIN,
    badge: "Admin",
  },
  {
    label: "Profile",
    href: "/profile",
    permission: Permission.VIEW_PROFILE,
  },
];

/**
 * Admin navigation items.
 */
export const adminNavItems: NavItem[] = [
  {
    label: "Admin Panel",
    href: "/admin",
    permission: Permission.ACCESS_ADMIN_PANEL,
  },
  {
    label: "User Management",
    href: "/admin/users",
    permission: Permission.MANAGE_USERS,
  },
  {
    label: "Role Management",
    href: "/admin/roles",
    minRole: UserRole.SUPER_ADMIN,
  },
  {
    label: "System Config",
    href: "/admin/system",
    permission: Permission.SYSTEM_CONFIGURATION,
  },
];
