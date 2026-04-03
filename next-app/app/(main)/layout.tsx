import { getPageSession } from "@/auth/lucia";
import { AppShell } from "@/components/AppShell";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getPageSession();
  const shellUser = user
    ? { role: user.role, displayName: user.displayName }
    : null;

  return <AppShell user={shellUser}>{children}</AppShell>;
}
