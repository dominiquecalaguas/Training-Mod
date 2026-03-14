import { NextResponse } from "next/server";
import { getPageSession } from "@/auth/lucia";

/**
 * Use in API routes that require an authenticated admin user.
 * Returns [null, errorResponse] if not admin; returns [user, null] if admin.
 */
export async function requireAdmin(): Promise<
  [user: { id: string; email: string; name: string | null; role: string }, null] | [null, NextResponse]
> {
  const { user } = await getPageSession();
  if (!user || user.role !== "admin") {
    return [null, NextResponse.json({ error: "Unauthorized" }, { status: 401 })];
  }
  return [user, null];
}
