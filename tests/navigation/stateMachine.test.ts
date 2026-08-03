import {
  deriveNavigationState,
  validateNavigationTransition,
  DEFAULT_FEATURE_GATES,
} from "@/navigation/stateMachine";
import { Permission, UserRole, UserWithRole } from "@/types/rbac";

const user: UserWithRole = { address: "GABC", role: UserRole.USER };
const powerUser: UserWithRole = { address: "GPOWER", role: UserRole.POWER_USER };

describe("navigation state machine", () => {
  it("allows public routes for guests", () => {
    const result = validateNavigationTransition("public", {
      pathname: "/",
      user: null,
      isAuthenticated: false,
    });

    expect(result).toMatchObject({ allowed: true, to: "public", event: "visitPublicRoute" });
  });

  it("blocks unauthenticated users from protected routes", () => {
    const result = validateNavigationTransition("public", {
      pathname: "/dashboard",
      user: null,
      isAuthenticated: false,
    });

    expect(result).toMatchObject({
      allowed: false,
      to: "authenticating",
      event: "requestProtectedRoute",
      redirectTo: "/",
      reason: "Authentication required",
    });
  });

  it("authorizes protected routes when role and permissions match", () => {
    const result = validateNavigationTransition("authenticating", {
      pathname: "/dashboard",
      user,
      isAuthenticated: true,
    });

    expect(result).toMatchObject({ allowed: true, to: "authenticated", event: "authorize" });
  });

  it("denies routes when the role or permission set is insufficient", () => {
    const result = validateNavigationTransition("authenticated", {
      pathname: "/analytics",
      user,
      isAuthenticated: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.to).toBe("accessDenied");
    expect(result.reason).toBe(`Requires minimum role: ${UserRole.POWER_USER}`);
  });

  it("blocks disabled feature gates before authorization succeeds", () => {
    const result = validateNavigationTransition("authenticated", {
      pathname: "/analytics",
      user: powerUser,
      isAuthenticated: true,
      features: { analytics: false },
    });

    expect(result).toMatchObject({
      allowed: false,
      to: "featureBlocked",
      event: "blockForFeature",
      feature: "analytics",
      redirectTo: "/dashboard",
    });
  });

  it("marks unknown routes as not found and invalid transition targets as blocked", () => {
    const result = validateNavigationTransition("accessDenied", {
      pathname: "/missing",
      user,
      isAuthenticated: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.to).toBe("notFound");
    expect(result.redirectTo).toBe("/404");
  });

  it("derives stable navigation states from route context", () => {
    expect(deriveNavigationState({ pathname: "/", user: null, isAuthenticated: false })).toBe("public");
    expect(deriveNavigationState({ pathname: "/dashboard", user: null, isAuthenticated: false })).toBe("authenticating");
    expect(deriveNavigationState({ pathname: "/dashboard", user, isAuthenticated: true })).toBe("authenticated");
    expect(deriveNavigationState({ pathname: "/analytics", user: powerUser, isAuthenticated: true, features: { analytics: false } })).toBe("featureBlocked");
  });

  it("keeps feature gates explicit and enabled by default", () => {
    expect(DEFAULT_FEATURE_GATES.map((gate) => gate.key)).toEqual([
      "dashboard",
      "analytics",
      "governance",
      "monitoring",
      "profile",
      "admin",
    ]);
    expect(DEFAULT_FEATURE_GATES.every((gate) => gate.enabled)).toBe(true);
    expect(Permission.VIEW_ANALYTICS).toBe("view_analytics");
  });
});
