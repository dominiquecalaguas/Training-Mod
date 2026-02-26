"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        if (res.status === 401) setError("Incorrect password.");
        else setError("Unable to verify password. Please try again.");
        return;
      }
      const redirectTo = searchParams.get("from") || "/admin/courses";
      window.location.href = redirectTo;
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
        Admin access
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Enter the admin password to manage courses and lessons.
      </p>
      <label className="mt-4 block text-sm font-medium text-zinc-700">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-0 focus:border-zinc-900"
          required
        />
      </label>
      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {submitting ? "Verifying…" : "Enter admin"}
      </button>
    </form>
  );
}
