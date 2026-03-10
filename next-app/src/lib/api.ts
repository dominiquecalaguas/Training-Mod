/**
 * Base URL for API requests from server-side code (Server Components, server actions).
 * Relative URLs fail in Node fetch, so we need an absolute origin.
 * Set NEXT_PUBLIC_APP_URL in .env (e.g. http://localhost:3000) or rely on Vercel.
 */
export function getApiBaseUrl(): string {
  if (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
