

OAuth - Prisma


Reqs
Vanilla OAuth (/authorize, /token)
Social sign-in via Auth0
Separate from the regular Prisma users



Non-functional reqs
None really, lets just get a V0 out there

Monitoring
Log MCP server tool calls


Steps for the user
User hits our MCP server with /authorize, gets auth code back
User hits our /token endpoint and gets an OAuth token back
^Somewhere in this, we would need to upsert to the oauth_users table.

Steps for us
Ping Auth0 and get an auth code back. We should upsert to the oauth_users table here.
After the user cashes iin

Implementation plan
Create our Auth0 account (web)
Configure terraform/auth0 subrepo of Training-Mod repo (code)
Create an application with Terraform, allow social sign-in (code)
Allow any localhost callbacks
Redirect URI should just be on the production URL
Do terraform plan (CLI)
Create a universal login page for the MCP server (code)

Create oauth_users table
Create oauth_grants table

Create the .well-known OAuth advertising endpoints
Gate mcp endpoint by client ID, hardcoded as domkatsu-mcp
Scaffold the middleware to check OAuth
Create the authn for accepting OAuth in the mcp server


