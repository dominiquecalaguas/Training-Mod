import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { oauthGrants } from "@/db/schema";
import { bearerToken, CLAUDE_CLIENT_ID, MCP_CLIENT_ID, mcpResource, sha256 } from "./oauth";

export async function authenticateMcpRequest(request: Request) {
  const token = bearerToken(request);
  if (!token) return null;
  const [grant] = await db.select({ userId: oauthGrants.oauthUserId, clientId: oauthGrants.clientId })
    .from(oauthGrants)
    .where(and(
      eq(oauthGrants.kind, "access"),
      eq(oauthGrants.tokenHash, sha256(token)),
      inArray(oauthGrants.clientId, [MCP_CLIENT_ID, CLAUDE_CLIENT_ID]),
      eq(oauthGrants.resource, mcpResource()),
      gt(oauthGrants.expiresAt, new Date()),
      isNull(oauthGrants.consumedAt),
    )).limit(1);
  return grant?.userId ? { userId: grant.userId, clientId: grant.clientId } : null;
}
