
### Web Architecture

Vercel - CI/CD
Supabase - DB
Database library (ORM) - Drizzle, with PostgreSQL

### Credentials
They're in the `.env` file locally
- SUPABASE_PASSWORD

### Analytics (optional)
For PostHog analytics (dashboard, course/lesson clicks):
- `NEXT_PUBLIC_POSTHOG_KEY` – PostHog project API key (client)
- `NEXT_PUBLIC_POSTHOG_HOST` – e.g. `https://us.i.posthog.com` (defaults to US cloud if omitted)
- `POSTHOG_PERSONAL_API_KEY` – Personal API key with `query:read` scope (for dashboard analytics API)
- `POSTHOG_PROJECT_ID` – PostHog project ID (from Project Settings in PostHog)
- `POSTHOG_HOST` – Optional; server-side PostHog host (defaults to `NEXT_PUBLIC_POSTHOG_HOST` or US cloud)


### For Database Changes
For DB migrations, we need to do the following:
- Make the DB schema changes in `src/db/schema/` (e.g. `users.ts`)
- Run `npm run db:generate` (writes to `drizzle/`) and `npm run db:migrate`
- Push the schema files and the `drizzle/` folder

Never do hard deletes for DB columns, this is to prevent downtime and broken functionality

### MCP OAuth login

The MCP endpoint at `/mcp` requires a broker-issued bearer token. A client discovers our `/authorize` and `/token` endpoints from the OAuth well-known metadata, then the browser signs in through Auth0 Universal Login. Auth0 redirects only to our fixed `/oauth/auth0/callback`; our broker then issues a single-use code to the MCP client. MCP users are stored in `oauth_users`, separate from regular `auth_user` records, and short-lived code and token hashes are stored in `oauth_grants`.

Set the Next.js runtime `MCP_PUBLIC_ORIGIN` to this app's HTTPS origin, `AUTH0_DOMAIN` to the Auth0 login hostname, and `AUTH0_CLIENT_ID` and `AUTH0_CLIENT_SECRET` to the **web application's** credentials. These are different from the Auth0 Management API application credentials used by Terraform. Keep secrets in deployment settings, not Git. For this rollout, use `dev-7y866uhhu4tmnhwo.us.auth0.com` as the runtime Auth0 domain; a custom login domain is optional later.

The broker accepts `http://localhost:<port>/callback` for the `domkatsu-mcp` local client and Claude's published OAuth client identity with its exact callback. In Claude, add the deployed `/mcp` URL as a custom connector and choose **Use Claude's published identity**. The server does not support dynamic client registration, refresh tokens, or arbitrary client redirect URLs. Access tokens last one hour, after which the client must sign in again.

Google is enabled in the Auth0 tenant. To enable GitHub sign-in, register one GitHub OAuth application with callback `https://<Auth0 login hostname>/login/callback` and supply its client ID and secret to the Auth0 Terraform configuration. Individual GitHub users supply only their own GitHub login, never those application credentials.

Before deploying, review `terraform/auth0`'s import plan, configure the web application secret in the Next.js deployment, and verify that an unauthenticated `/mcp` request returns a 401 with OAuth metadata. Then complete a real browser login from a local client and from Claude, call an MCP tool with the returned token, and confirm that a second exchange of the same authorization code returns `invalid_grant`.
