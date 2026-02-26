import { AdminGate } from "@//components/AdminGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <main className="min-h-screen bg-zinc-50 py-8 px-4 text-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <header className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Admin dashboard
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Manage courses, lessons, and ordering.
              </p>
            </div>
          </header>
          {children}
        </div>
      </main>
    </AdminGate>
  );
}

