"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import posthog from "posthog-js";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordFieldReady, setPasswordFieldReady] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Incorrect email or password.",
        );
        return;
      }
      posthog.identify(email, { email });
      posthog.capture("user_signed_in", { email });
      const from = searchParams.get("from") ?? "/";
      const redirectTo =
        from.startsWith("/login") || from.startsWith("/register") ? "/" : from;
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="w-full max-w-sm rounded-xl border border-neutral-300 bg-white p-6 shadow-sm ring-1 ring-neutral-200"
    >
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Sign in with your email and password.
      </p>
      <label className="mt-4 block text-sm font-medium text-neutral-700">
        Email
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-0 focus:border-neutral-500"
          required
          autoComplete="off"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-neutral-700">
        Password
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setPasswordFieldReady(true)}
          readOnly={!passwordFieldReady}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-0 focus:border-neutral-500"
          required
          autoComplete="new-password"
          data-form-type="other"
          data-lpignore="true"
        />
      </label>
      {error && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="mt-4 text-center text-sm text-neutral-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-neutral-700 underline hover:text-neutral-900">
          Sign up
        </Link>
      </p>
    </form>
  );
}
