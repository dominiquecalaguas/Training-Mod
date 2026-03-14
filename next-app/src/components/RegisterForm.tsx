"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [secretKey, setSecretKey] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretKey: secretKey.trim(),
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Something went wrong. Please try again.",
        );
        return;
      }
      router.push("/");
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
      className="w-full max-w-sm rounded-xl border border-neutral-300 bg-white p-6 shadow-sm ring-1 ring-neutral-200"
    >
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
        Create an account
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Enter the registration key, then your details.
      </p>
      <label className="mt-4 block text-sm font-medium text-neutral-700">
        Registration key
        <input
          type="password"
          name="secretKey"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-0 focus:border-neutral-500"
          required
          autoComplete="off"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-neutral-700">
        Name
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-0 focus:border-neutral-500"
          required
          maxLength={255}
          autoComplete="name"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-neutral-700">
        Email
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-0 focus:border-neutral-500"
          required
          autoComplete="email"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-neutral-700">
        Password
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-0 focus:border-neutral-500"
          required
          minLength={6}
          maxLength={255}
          autoComplete="new-password"
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
        {submitting ? "Creating account…" : "Sign up"}
      </button>
      <p className="mt-4 text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-neutral-700 underline hover:text-neutral-900">
          Sign in
        </Link>
      </p>
    </form>
  );
}
