import { Suspense } from "react";
import { AdminLoginForm } from "@//components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Suspense fallback={<div className="text-zinc-500">Loading…</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
