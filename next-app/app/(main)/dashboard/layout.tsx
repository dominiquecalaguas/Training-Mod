import { AdminAuthGate } from "@/components/AdminAuthGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGate loginReturnPath="/dashboard">
    <main className="min-h-screen bg-zinc-50 py-8 px-4 text-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Analytics for courses and lessons.
          </p>
        </header>
        {children}
      </div>
    </main>
    </AdminAuthGate>
  );
}
