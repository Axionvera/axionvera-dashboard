# Role-Based Access Control (RBAC) System

## Overview

The AxionVera dashboard implements a comprehensive Role-Based Access Control (RBAC) system to manage user permissions and access to features. This system ensures that users can only access functionality appropriate to their role, improving security and user experience.

## Architecture

### Components

1. **Types & Definitions** (`src/types/rbac.ts`)
   - User roles enumeration
   - Permission enumeration
   - Role-permission mappings
   - Type definitions for access control

2. **Core Utilities** (`src/permissions/rbac.ts`)
   - Pure functions for permission evaluation
   - Role hierarchy management
   - Permission checking logic

3. **Route Configuration** (`src/permissions/routes.ts`)
   - Route access control definitions
   - Path matching utilities
   - Public route configuration

4. **React Context** (`src/contexts/RBACContext.tsx`)
   - React hooks for permission checking
   - Integration with wallet authentication
   - User role management

5. **Guard Components** (`src/components/guards/`)
   - `PermissionGuard`: Conditional component rendering
   - `RouteGuard`: Page-level access control
   - `withRouteGuard`: HOC for route protection

6. **Navigation Components** (`src/components/layout/RoleAwareNav.tsx`)
   - Role-aware navigation rendering
   - Dynamic menu filtering

## Role Hierarchy

The system defines five roles in ascending order of privileges:

```typescript
enum UserRole {
  GUEST = "guest",           // Unauthenticated users
  USER = "user",             // Standard authenticated users
  POWER_USER = "power_user", // Advanced users
  ADMIN = "admin",           // Administrators
  SUPER_ADMIN = "super_admin" // Super administrators
}
```

### Role Capabilities

#### GUEST
- View vault information (read-only)
- View governance proposals
- Browse public content

#### USER (inherits GUEST)
- Connect wallet
- View account balance
- Deposit/withdraw from vault
- Stake tokens
- Vote on proposals
- Manage profile
- Security settings

#### POWER_USER (inherits USER)
- Access analytics dashboard
- View advanced analytics
- Export analytics data
- Create governance proposals

#### ADMIN (inherits POWER_USER)
- Manage governance proposals
- Access monitoring dashboard
- View system logs
- Access admin panel
- Manage users

#### SUPER_ADMIN (all permissions)
- Manage user roles
- System configuration
- Full platform control

## Permissions

The system defines granular permissions for specific actions:

### Wallet & Balance
- `VIEW_BALANCE`: View account balance
- `MANAGE_WALLET`: Connect/disconnect wallet

### Vault Operations
- `VIEW_VAULT`: View vault information
- `DEPOSIT_VAULT`: Deposit to vault
- `WITHDRAW_VAULT`: Withdraw from vault
- `STAKE_VAULT`: Stake tokens

### Analytics
- `VIEW_ANALYTICS`: View basic analytics
- `VIEW_ADVANCED_ANALYTICS`: View advanced analytics
- `EXPORT_ANALYTICS`: Export analytics data

### Governance
- `VIEW_PROPOSALS`: View proposals
- `VOTE_PROPOSALS`: Vote on proposals
- `CREATE_PROPOSALS`: Create new proposals
- `MANAGE_PROPOSALS`: Manage/edit proposals

### Monitoring & System
- `VIEW_MONITORING`: View monitoring dashboard
- `MANAGE_MONITORING`: Manage monitoring settings
- `VIEW_SYSTEM_LOGS`: Access system logs

### User Management
- `VIEW_PROFILE`: View own profile
- `EDIT_PROFILE`: Edit own profile
- `MANAGE_SECURITY`: Manage security settings
- `MANAGE_USERS`: Manage other users

### Administrative
- `ACCESS_ADMIN_PANEL`: Access admin panel
- `MANAGE_ROLES`: Manage user roles
- `SYSTEM_CONFIGURATION`: Configure system settings

## Usage Examples

### Component-Level Protection

```typescript
import { PermissionGuard } from "@/components/guards";
import { Permission } from "@/types/rbac";

// Single permission
<PermissionGuard permission={Permission.VIEW_ANALYTICS}>
  <AnalyticsPanel />
</PermissionGuard>

// Multiple permissions (all required)
<PermissionGuard permissions={[Permission.CREATE_PROPOSALS, Permission.VOTE_PROPOSALS]}>
  <ProposalForm />
</PermissionGuard>

// With fallback
<PermissionGuard
  permission={Permission.VIEW_MONITORING}
  fallback={<div>Access Denied</div>}
  hideOnDenied={false}
>
  <MonitoringPanel />
</PermissionGuard>

// Role-based
<PermissionGuard minRole={UserRole.ADMIN}>
  <AdminPanel />
</PermissionGuard>
```

### Page-Level Protection

```typescript
import { RouteGuard, withRouteGuard } from "@/components/guards";
import { UserRole, Permission } from "@/types/rbac";

// Using component
export default function AnalyticsPage() {
  return (
    <RouteGuard
      minRole={UserRole.POWER_USER}
      permissions={[Permission.VIEW_ANALYTICS]}
    >
      <AnalyticsContent />
    </RouteGuard>
  );
}

// Using HOC (automatic route config lookup)
function AdminPage() {
  return <AdminContent />;
}

export default withRouteGuard(AdminPage);
```

### Hook-Based Checks

```typescript
import { useRBAC, usePermission, useRole } from "@/contexts/RBACContext";
import { Permission, UserRole } from "@/types/rbac";

function MyComponent() {
  // Full RBAC context
  const { role, hasPermission, isAdmin } = useRBAC();

  // Single permission check
  const canViewAnalytics = usePermission(Permission.VIEW_ANALYTICS);

  // Role check
  const isAtLeastPowerUser = useRole(UserRole.POWER_USER);

  if (canViewAnalytics) {
    return <Analytics />;
  }

  return <UpgradePrompt />;
}
```

### Role-Aware Navigation

```typescript
import { RoleAwareNav, NavItem } from "@/components/layout";
import { Permission, UserRole } from "@/types/rbac";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", minRole: UserRole.USER },
  { label: "Analytics", href: "/analytics", permission: Permission.VIEW_ANALYTICS },
  { label: "Admin", href: "/admin", minRole: UserRole.ADMIN, badge: "Admin" },
];

<RoleAwareNav items={navItems} orientation="vertical" />
```

### Programmatic Permission Checks

```typescript
import { hasPermission, checkPermissions, getUserRole } from "@/permissions/rbac";
import { Permission } from "@/types/rbac";

// Get user role from wallet address
const user = getUserRole(walletAddress);

// Check single permission
if (hasPermission(user, Permission.CREATE_PROPOSALS)) {
  // Allow proposal creation
}

// Comprehensive check
const result = checkPermissions(
  user,
  [Permission.VIEW_ANALYTICS, Permission.EXPORT_ANALYTICS],
  UserRole.POWER_USER
);

if (!result.granted) {
  console.log(result.reason);
  console.log(result.missingPermissions);
}
```

## Route Configuration

Routes are configured in `src/permissions/routes.ts`:

```typescript
export const ROUTE_ACCESS_CONFIG: RouteAccess[] = [
  {
    path: "/",
    minRole: UserRole.GUEST,
    allowGuest: true,
  },
  {
    path: "/dashboard",
    minRole: UserRole.USER,
    permissions: [Permission.VIEW_BALANCE, Permission.VIEW_VAULT],
  },
  {
    path: "/analytics",
    minRole: UserRole.POWER_USER,
    permissions: [Permission.VIEW_ANALYTICS],
  },
  {
    path: "/admin",
    minRole: UserRole.ADMIN,
    permissions: [Permission.ACCESS_ADMIN_PANEL],
  },
];
```

## Middleware Integration

The Next.js middleware (`src/middleware.ts`) performs basic authentication checks:

```typescript
import { isPublicRoute, requiresAuth } from "@/permissions/routes";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check authentication
  if (requiresAuth(pathname)) {
    const hasWallet = request.cookies.get("hasWallet")?.value === "true";
    if (!hasWallet) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}
```

> **Note**: Full permission checking happens client-side in `RouteGuard` components because role determination requires wallet context.

## Security Considerations

### Current Implementation

1. **Client-Side Enforcement**: The current implementation performs all permission checks on the client side. This is suitable for UI/UX purposes but should not be relied upon for security.

2. **Default Role**: Currently, all connected wallets receive the `USER` role by default. This is a placeholder implementation.

3. **No Backend Validation**: Permission checks are not validated by a backend service.

### Production Requirements

For a production deployment, the following enhancements are required:

1. **Backend Role Storage**
   - Store user roles in a secure database or smart contract
   - Implement API endpoints for role retrieval
   - Add role assignment and management APIs

2. **Smart Contract Integration**
   - Store role assignments on-chain for transparency
   - Implement permission verification in smart contracts
   - Add on-chain governance for role changes

3. **Backend API Protection**
   - Validate permissions on the server side for all sensitive operations
   - Implement JWT or similar authentication tokens
   - Add rate limiting and audit logging

4. **Session Management**
   - Implement secure session storage
   - Add session expiration and refresh mechanisms
   - Handle role changes during active sessions

### Migration Path

To implement backend role management:

1. Update `getUserRole()` in `src/permissions/rbac.ts` to fetch from backend:

```typescript
export async function getUserRole(address: string | null): Promise<UserWithRole | null> {
  if (!address) return null;
  
  const response = await fetch(`/api/users/${address}/role`);
  const data = await response.json();
  
  return {
    address,
    role: data.role,
    customPermissions: data.customPermissions,
  };
}
```

2. Add backend API routes:
   - `GET /api/users/:address/role` - Get user role
   - `POST /api/users/:address/role` - Assign role (admin only)
   - `POST /api/users/:address/permissions` - Grant custom permissions

3. Implement smart contract role registry (optional but recommended)

## Testing

### Unit Tests

```typescript
import { hasPermission, hasMinimumRole } from "@/permissions/rbac";
import { UserRole, Permission } from "@/types/rbac";

describe("RBAC Utilities", () => {
  it("should check permissions correctly", () => {
    const user = { address: "0x123", role: UserRole.POWER_USER };
    expect(hasPermission(user, Permission.VIEW_ANALYTICS)).toBe(true);
    expect(hasPermission(user, Permission.MANAGE_USERS)).toBe(false);
  });

  it("should check role hierarchy", () => {
    expect(hasMinimumRole(UserRole.ADMIN, UserRole.USER)).toBe(true);
    expect(hasMinimumRole(UserRole.USER, UserRole.ADMIN)).toBe(false);
  });
});
```

### Integration Tests

```typescript
import { render, screen } from "@testing-library/react";
import { PermissionGuard } from "@/components/guards";

describe("PermissionGuard", () => {
  it("should render children when permission granted", () => {
    render(
      <RBACProvider>
        <PermissionGuard permission={Permission.VIEW_BALANCE}>
          <div>Protected Content</div>
        </PermissionGuard>
      </RBACProvider>
    );
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
```

## Future Enhancements

1. **Dynamic Role Assignment**
   - UI for admins to assign roles
   - Bulk role management
   - Role templates

2. **Permission Sets**
   - Predefined permission bundles
   - Custom permission groups
   - Permission inheritance

3. **Audit Logging**
   - Track permission checks
   - Log role changes
   - Security event monitoring

4. **Time-Based Permissions**
   - Temporary role elevation
   - Scheduled access
   - Time-bound permissions

5. **Multi-Factor Authorization**
   - Require additional verification for sensitive actions
   - Hardware wallet signing for admin operations

## Troubleshooting

### User Can't Access Route

1. Check user's role: Use React DevTools to inspect `RBACContext`
2. Verify route configuration in `ROUTE_ACCESS_CONFIG`
3. Check wallet connection status
4. Review browser console for permission errors

### Permission Guard Not Working

1. Ensure `RBACProvider` wraps the component tree
2. Verify permission is correctly assigned to user's role
3. Check for typos in permission names
4. Confirm user object is not null

### Role Not Updating

1. Check wallet connection state
2. Verify `getUserRole()` is returning correct data
3. Clear browser cache and cookies
3. Restart development server

## References

- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)
- [React Context API](https://react.dev/reference/react/useContext)
- [RBAC Best Practices](https://en.wikipedia.org/wiki/Role-based_access_control)
