

# MCP OAuth rollout notes

The MCP server uses our own OAuth broker. MCP clients discover `/authorize` and `/token` through the well-known metadata. The browser signs in with Auth0 Universal Login, then Auth0 returns to the fixed Next.js callback at `/oauth/auth0/callback`. Our broker issues a single-use authorization code and an opaque, one-hour access token. The client sees the Training Mod OAuth endpoints; Auth0 is an upstream identity provider.

MCP identities live in `oauth_users`, separate from regular application users. `oauth_grants` stores pending login transactions, authorization codes, and access token hashes. Authorization codes are bound to a client, redirect URI, resource, and PKCE challenge. A consumed code cannot mint another token.

The existing Dominique's Web Portfolio Auth0 application is reused as a confidential Regular Web application. Its Google connection remains enabled. The Auth0 tenant hostname is used for Universal Login for now; a custom domain is optional. GitHub sign-in is on hold until a GitHub OAuth application is registered and its credentials are provided outside Git.

Allowed MCP clients are `domkatsu-mcp` with an exact `http://localhost:<port>/callback` redirect and Claude's published OAuth client identity with its exact callback. Dynamic client registration, refresh tokens, and arbitrary redirect URIs are out of scope.

Before rollout, review and apply the Auth0 Terraform import plan, configure the web application's secret and public origin in the Next.js deployment, and run an end-to-end login from each client. Confirm that an unauthenticated `/mcp` request advertises OAuth metadata, an authenticated request can call a tool, and replaying an authorization code returns `invalid_grant`. See `terraform/auth0/README.md` and `next-app/README.md` for setup details.

