import { createRemoteJWKSet, jwtVerify } from "jose";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { oauthGrants, oauthUsers } from "@/db/schema";
import { auth0Config, newId, oauthError, publicOrigin, randomToken, sha256 } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const state = params.get("state");
  if (!state) return oauthError("invalid_request");

  const [pending] = await db.update(oauthGrants)
    .set({ consumedAt: new Date() })
    .where(and(eq(oauthGrants.kind, "pending"), eq(oauthGrants.stateHash, sha256(state)), gt(oauthGrants.expiresAt, new Date()), isNull(oauthGrants.consumedAt)))
    .returning();

  if (!pending?.redirectUri || !pending.codeChallenge || !pending.auth0CodeVerifier || !pending.auth0Nonce) return oauthError("invalid_request");
  const redirect = new URL(pending.redirectUri);
  const clientState = pending.clientState;
  if (params.has("error")) {
    redirect.searchParams.set("error", "access_denied");
    if (clientState) redirect.searchParams.set("state", clientState);
    return Response.redirect(redirect, 302);
  }
  const auth0Code = params.get("code");
  if (!auth0Code) return oauthError("invalid_request");

  const { issuer, clientId, clientSecret } = auth0Config();
  const tokenResponse = await fetch(new URL("oauth/token", issuer), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code: auth0Code, redirect_uri: `${publicOrigin()}/oauth/auth0/callback`, code_verifier: pending.auth0CodeVerifier }),
    cache: "no-store",
  });
  if (!tokenResponse.ok) return oauthError("server_error", 502);
  const tokenData: { id_token?: string } = await tokenResponse.json();
  if (!tokenData.id_token) return oauthError("server_error", 502);

  const jwks = createRemoteJWKSet(new URL(".well-known/jwks.json", issuer));
  const { payload } = await jwtVerify(tokenData.id_token, jwks, { issuer, audience: clientId });
  if (!payload.sub || payload.nonce !== pending.auth0Nonce) return oauthError("invalid_request");

  const [user] = await db.insert(oauthUsers).values({
    id: newId(), issuer, subject: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
    name: typeof payload.name === "string" ? payload.name : null,
  }).onConflictDoUpdate({
    target: [oauthUsers.issuer, oauthUsers.subject],
    set: { email: typeof payload.email === "string" ? payload.email : null, name: typeof payload.name === "string" ? payload.name : null, updatedAt: new Date() },
  }).returning({ id: oauthUsers.id });

  const code = randomToken();
  await db.insert(oauthGrants).values({
    id: newId(), kind: "code", clientId: pending.clientId, resource: pending.resource,
    redirectUri: pending.redirectUri, codeChallenge: pending.codeChallenge,
    tokenHash: sha256(code), oauthUserId: user.id, expiresAt: new Date(Date.now() + 5 * 60_000),
  });
  redirect.searchParams.set("code", code);
  if (clientState) redirect.searchParams.set("state", clientState);
  return Response.redirect(redirect, 302);
}
