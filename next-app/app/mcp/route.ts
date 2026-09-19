import { timingSafeEqual } from "node:crypto";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { createDominiquePortfolioMcpServer } from "@/lib/mcp/dominique-portfolio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handler = createMcpHandler(createDominiquePortfolioMcpServer, {
  legacy: "stateless",
  onerror(error) {
    console.error("MCP request failed", error);
  },
});

function unauthorized(message: string, status: 401 | 500) {
  return Response.json(
    { error: message },
    {
      status,
      headers:
        status === 401
          ? { "WWW-Authenticate": 'Bearer realm="mcp"' }
          : undefined,
    },
  );
}

function hasValidBearerToken(request: Request, expectedToken: string) {
  const authorization = request.headers.get("authorization");
  const prefix = "Bearer ";

  if (!authorization?.startsWith(prefix)) {
    return false;
  }

  const suppliedToken = authorization.slice(prefix.length);
  const supplied = Buffer.from(suppliedToken);
  const expected = Buffer.from(expectedToken);

  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function serveMcp(request: Request) {
  const apiKey = process.env.MCP_API_KEY?.trim();

  if (!apiKey) {
    return unauthorized("MCP_API_KEY is not configured", 500);
  }

  if (!hasValidBearerToken(request, apiKey)) {
    return unauthorized("Unauthorized", 401);
  }

  return handler.fetch(request);
}

export const GET = serveMcp;
export const POST = serveMcp;
export const DELETE = serveMcp;
