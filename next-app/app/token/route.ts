import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { oauthGrants } from "@/db/schema";
import { matchesChallenge, MCP_CLIENT_ID, MCP_SCOPE, mcpResource, newId, oauthError, randomToken, sha256 } from "@/lib/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return oauthError("invalid_request");
  const params = new URLSearchParams(await request.text());
  const code = params.get("code") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const verifier = params.get("code_verifier") ?? "";
  const resource = params.get("resource") ?? "";

  if (params.get("grant_type") !== "authorization_code" || params.get("client_id") !== MCP_CLIENT_ID || !/^[A-Za-z0-9_-]{43}$/.test(code) || resource !== mcpResource()) return oauthError("invalid_request");

  const [grant] = await db.select().from(oauthGrants).where(and(eq(oauthGrants.kind, "code"), eq(oauthGrants.tokenHash, sha256(code)), gt(oauthGrants.expiresAt, new Date()), isNull(oauthGrants.consumedAt))).limit(1);
  if (!grant || !grant.codeChallenge || !grant.oauthUserId || grant.clientId !== MCP_CLIENT_ID || grant.redirectUri !== redirectUri || grant.resource !== resource || !matchesChallenge(verifier, grant.codeChallenge)) return oauthError("invalid_grant");

  const [redeemed] = await db.update(oauthGrants).set({ consumedAt: new Date() }).where(and(eq(oauthGrants.id, grant.id), isNull(oauthGrants.consumedAt), gt(oauthGrants.expiresAt, new Date()))).returning({ id: oauthGrants.id });
  if (!redeemed) return oauthError("invalid_grant");

  const accessToken = randomToken();
  await db.insert(oauthGrants).values({
    id: newId(), kind: "access", clientId: MCP_CLIENT_ID, resource,
    tokenHash: sha256(accessToken), oauthUserId: grant.oauthUserId,
    expiresAt: new Date(Date.now() + 60 * 60_000),
  });

  return Response.json({ access_token: accessToken, token_type: "Bearer", expires_in: 3600, scope: MCP_SCOPE }, {
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}
