import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Admin and dashboard are gated by Lucia (role "admin") in their layouts (AdminAuthGate).
// Redirect legacy admin login URL to app login so "from" works.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.redirect(
      new URL("/login?from=" + encodeURIComponent("/admin/courses"), request.url),
    );
  }

  return NextResponse.next();
}
