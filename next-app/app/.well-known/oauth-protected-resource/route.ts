import { MCP_SCOPE, mcpResource, publicOrigin } from "@/lib/mcp/oauth";

export function GET() {
  return Response.json({
    resource: mcpResource(),
    authorization_servers: [publicOrigin()],
    scopes_supported: [MCP_SCOPE],
    bearer_methods_supported: ["header"],
  });
}
