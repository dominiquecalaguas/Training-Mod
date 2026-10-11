import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { oauthGrants } from "@/db/schema";
import { matchesChallenge, MCP_SCOPE, mcpResource, newId, oauthError, randomToken, sha256, validClientRedirect } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return oauthError("invalid_request");
  const params = new URLSearchParams(await request.text());
  const code = params.get("code") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const verifier = params.get("code_verifier") ?? "";
  const resource = params.get("resource") ?? "";
  const clientId = params.get("client_id") ?? "";

  if (params.get("grant_type") !== "authorization_code" || !validClientRedirect(clientId, redirectUri) || !/^[A-Za-z0-9_-]{43}$/.test(code) || resource !== mcpResource()) return oauthError("invalid_request");

  const codeHash = sha256(code);
  const [grant] = await db.select().from(oauthGrants).where(and(eq(oauthGrants.kind, "code"), eq(oauthGrants.tokenHash, codeHash))).limit(1);
  if (grant?.consumedAt) {
    console.warn("MCP authorization code replay detected", { grantId: grant.id, clientId });
    return oauthError("invalid_grant");
  }
  if (!grant || !grant.codeChallenge || !grant.oauthUserId || grant.clientId !== clientId || grant.redirectUri !== redirectUri || grant.resource !== resource || grant.expiresAt <= new Date() || !matchesChallenge(verifier, grant.codeChallenge)) return oauthError("invalid_grant");

  const accessToken = randomToken();
  const issued = await db.transaction(async (tx) => {
    const [redeemed] = await tx.update(oauthGrants).set({ consumedAt: new Date() }).where(and(
      eq(oauthGrants.id, grant.id),
      eq(oauthGrants.kind, "code"),
      eq(oauthGrants.clientId, clientId),
      eq(oauthGrants.redirectUri, redirectUri),
      eq(oauthGrants.resource, resource),
      isNull(oauthGrants.consumedAt),
      gt(oauthGrants.expiresAt, new Date()),
    )).returning({ id: oauthGrants.id });
    if (!redeemed) return false;

    await tx.insert(oauthGrants).values({
      id: newId(), kind: "access", clientId, resource,
      tokenHash: sha256(accessToken), oauthUserId: grant.oauthUserId!,
      expiresAt: new Date(Date.now() + 60 * 60_000),
    });
    return true;
  });
  if (!issued) {
    console.warn("MCP authorization code replay detected", { grantId: grant.id, clientId });
    return oauthError("invalid_grant");
  }

  return Response.json({ access_token: accessToken, token_type: "Bearer", expires_in: 3600, scope: MCP_SCOPE }, {
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}
