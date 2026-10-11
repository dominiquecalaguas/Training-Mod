import { db } from "@/db/client";
import { oauthGrants } from "@/db/schema";
import { auth0Config, auth0StateCookie, challenge, MCP_SCOPE, mcpResource, newId, oauthError, publicOrigin, randomToken, sha256, validClientRedirect } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const redirectUri = params.get("redirect_uri") ?? "";
  const codeChallenge = params.get("code_challenge") ?? "";
  const scope = params.get("scope");

  const mcpClientId = params.get("client_id") ?? "";
  if (params.get("response_type") !== "code" || !validClientRedirect(mcpClientId, redirectUri) || params.get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(codeChallenge) || params.get("resource") !== mcpResource() || (scope !== null && scope !== MCP_SCOPE)) {
    return oauthError("invalid_request");
  }

  const { issuer, clientId } = auth0Config();
  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken();

  await db.insert(oauthGrants).values({
    id: newId(),
    kind: "pending",
    clientId: mcpClientId,
    resource: mcpResource(),
    redirectUri,
    stateHash: sha256(state),
    clientState: params.get("state"),
    codeChallenge,
    auth0CodeVerifier: verifier,
    auth0Nonce: nonce,
    expiresAt: new Date(Date.now() + 10 * 60_000),
  });

  const authorizeUrl = new URL("authorize", issuer);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", `${publicOrigin()}/oauth/auth0/callback`);
  authorizeUrl.searchParams.set("scope", "openid profile email");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("nonce", nonce);
  authorizeUrl.searchParams.set("code_challenge", challenge(verifier));
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  const response = Response.redirect(authorizeUrl, 302);
  response.headers.set("Set-Cookie", auth0StateCookie(state));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
