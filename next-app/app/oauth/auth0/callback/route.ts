import { createRemoteJWKSet, jwtVerify } from "jose";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { oauthGrants, oauthUsers } from "@/db/schema";
import { auth0Config, auth0StateCookie, matchesAuth0StateCookie, newId, publicOrigin, randomToken, sha256 } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const state = params.get("state");
  if (!state || !matchesAuth0StateCookie(request, state)) return Response.redirect(`${publicOrigin()}/oauth/error`, 302);

  function finish(response: Response) {
    response.headers.set("Set-Cookie", auth0StateCookie(state!, true));
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const [pending] = await db.update(oauthGrants)
    .set({ consumedAt: new Date() })
    .where(and(eq(oauthGrants.kind, "pending"), eq(oauthGrants.stateHash, sha256(state)), gt(oauthGrants.expiresAt, new Date()), isNull(oauthGrants.consumedAt)))
    .returning();

  if (!pending?.redirectUri || !pending.codeChallenge || !pending.auth0CodeVerifier || !pending.auth0Nonce) return finish(Response.redirect(`${publicOrigin()}/oauth/error`, 302));
  const redirect = new URL(pending.redirectUri);
  const clientState = pending.clientState;
  function finishClientError(error: string) {
    redirect.searchParams.set("error", error);
    if (clientState) redirect.searchParams.set("state", clientState);
    return finish(Response.redirect(redirect, 302));
  }

  if (params.has("error")) return finishClientError("access_denied");
  const auth0Code = params.get("code");
  if (!auth0Code) return finishClientError("server_error");

  const { issuer, clientId, clientSecret } = auth0Config();
  let payload;
  try {
    const tokenResponse = await fetch(new URL("oauth/token", issuer), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "authorization_code", client_id: clientId, client_secret: clientSecret, code: auth0Code, redirect_uri: `${publicOrigin()}/oauth/auth0/callback`, code_verifier: pending.auth0CodeVerifier }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return finishClientError("server_error");
    const tokenData: { id_token?: string } = await tokenResponse.json();
    if (!tokenData.id_token) return finishClientError("server_error");

    const jwks = createRemoteJWKSet(new URL(".well-known/jwks.json", issuer));
    ({ payload } = await jwtVerify(tokenData.id_token, jwks, { issuer, audience: clientId }));
  } catch {
    return finishClientError("server_error");
  }
  if (!payload.sub || payload.nonce !== pending.auth0Nonce) return finishClientError("server_error");

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
  return finish(Response.redirect(redirect, 302));
}
