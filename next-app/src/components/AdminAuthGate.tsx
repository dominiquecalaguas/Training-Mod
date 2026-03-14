import { redirect } from "next/navigation";
import { getPageSession } from "@/auth/lucia";

type Props = {
  children: React.ReactNode;
  /** Path to send user back to after login (e.g. /admin/courses or /dashboard) */
  loginReturnPath?: string;
};

/**
 * Server component: gates admin/dashboard content behind Lucia session and role "admin".
 * - No session → redirect to /login?from=loginReturnPath
 * - Session but role !== "admin" → redirect to / (forbidden)
 */
export async function AdminAuthGate({ children, loginReturnPath = "/admin/courses" }: Props) {
  const { user } = await getPageSession();

  if (!user) {
    const from = encodeURIComponent(loginReturnPath);
    redirect(`/login?from=${from}`);
  }

  if (user.role !== "admin") {
    redirect("/?forbidden=1");
  }

  return <>{children}</>;
}
