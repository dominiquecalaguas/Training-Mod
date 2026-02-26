import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_LOGIN = "/admin/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === ADMIN_LOGIN) return NextResponse.next();

  const authed = request.cookies.get("admin_authed")?.value === "1";
  if (!authed) {
    const login = new URL(ADMIN_LOGIN, request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}
