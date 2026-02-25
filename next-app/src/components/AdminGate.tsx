"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "trainingmod_admin_authed";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = window.localStorage.getItem(STORAGE_KEY);
    if (flag === "true") {
      setAuthed(true);
    } else {
      setAuthed(false);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/check-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError("Incorrect password.");
        } else {
          setError("Unable to verify password. Please try again.");
        }
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, "true");
      }
      setAuthed(true);
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-600">
        Loading admin…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
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
      </div>
    );
  }

  return <>{children}</>;
}

