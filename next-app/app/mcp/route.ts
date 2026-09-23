import { createMcpHandler } from "@modelcontextprotocol/server";
import { createDominiquePortfolioMcpServer } from "@/lib/mcp/dominique-portfolio";
import { authenticateMcpRequest } from "@/lib/mcp/authenticate";
import { bearerToken, MCP_SCOPE, mcpResource, publicOrigin } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handler = createMcpHandler(createDominiquePortfolioMcpServer, {
  legacy: "stateless",
  onerror(error) {
    console.error("MCP request failed", error);
  },
});

function unauthorized() {
  return Response.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: { "WWW-Authenticate": `Bearer resource_metadata="${publicOrigin()}/.well-known/oauth-protected-resource", scope="${MCP_SCOPE}"` },
    },
  );
}

async function serveMcp(request: Request) {
  const identity = await authenticateMcpRequest(request);
  if (!identity) return unauthorized();

  return handler.fetch(request, {
    authInfo: {
      token: bearerToken(request)!,
      clientId: identity.clientId,
      scopes: [MCP_SCOPE],
      resource: new URL(mcpResource()),
      extra: { oauthUserId: identity.userId },
    },
  });
}

export const GET = serveMcp;
export const POST = serveMcp;
export const DELETE = serveMcp;
