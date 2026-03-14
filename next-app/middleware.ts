import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_LOGIN = "/admin/login";
const NOT_FOUND_PATH = "/404";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dashboard: admin-only; non-admins get 404
  if (pathname.startsWith("/dashboard")) {
    const authed = request.cookies.get("admin_authed")?.value === "1";
    if (!authed) {
      return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
    }
    return NextResponse.next();
  }

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
