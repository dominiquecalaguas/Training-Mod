import { MCP_SCOPE, publicOrigin } from "@/lib/mcp/oauth";

export function GET() {
  const issuer = publicOrigin();
  return Response.json({
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: [MCP_SCOPE],
  });
}
