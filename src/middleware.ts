import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isKnownRoute, isPublicRoute, requiresAuth } from "@/permissions/routes";

/**
 * Middleware for route protection based on RBAC.
 * 
 * Note: Full permission checking (role-based) happens client-side in RouteGuard
 * components because we need wallet context. This middleware only handles
 * basic authentication (wallet connection) checks.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Let unknown routes reach Next.js 404 handling instead of redirecting them.
  if (!isKnownRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  if (requiresAuth(pathname)) {
    const hasWallet = request.cookies.get("hasWallet")?.value === "true";

    if (!hasWallet) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Ignore API routes and Next.js static assets for performance.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
