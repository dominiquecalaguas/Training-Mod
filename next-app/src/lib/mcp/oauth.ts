import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

export const MCP_CLIENT_ID = "domkatsu-mcp";
export const MCP_SCOPE = "mcp:read";

export function publicOrigin() {
  const configured = process.env.MCP_PUBLIC_ORIGIN;
  if (!configured) throw new Error("MCP_PUBLIC_ORIGIN is not configured");
  const url = new URL(configured);
  if ((url.protocol !== "https:" && url.hostname !== "localhost") || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("MCP_PUBLIC_ORIGIN must be an HTTPS origin or localhost origin");
  }
  return url.origin;
}

export function mcpResource() {
  return `${publicOrigin()}/mcp`;
}

export function auth0Config() {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  if (!domain || !clientId || !clientSecret) throw new Error("Auth0 is not configured");
  const issuer = new URL(domain.startsWith("https://") ? domain : `https://${domain}`);
  if (issuer.protocol !== "https:" || issuer.pathname !== "/" || issuer.search || issuer.hash) {
    throw new Error("AUTH0_DOMAIN must be an HTTPS origin");
  }
  return { issuer: `${issuer.origin}/`, clientId, clientSecret };
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function challenge(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

export function matchesChallenge(verifier: string, expected: string) {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || !/^[A-Za-z0-9_-]{43}$/.test(expected)) return false;
  return timingSafeEqual(Buffer.from(challenge(verifier)), Buffer.from(expected));
}

export function randomToken() {
  return randomBytes(32).toString("base64url");
}

export function newId() {
  return randomUUID();
}

export function validClientRedirect(value: string) {
  try {
    const uri = new URL(value);
    return uri.protocol === "http:" && uri.hostname === "localhost" && uri.pathname === "/callback" && !uri.username && !uri.password && !uri.search && !uri.hash && uri.href === value;
  } catch {
    return false;
  }
}

export function oauthError(error: string, status = 400) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}
