# MCP Auth0 configuration

This configuration adopts the existing Dominique's Web Portfolio Auth0 application and its Google connection. Terraform changes that application to a confidential Regular Web application for the MCP login broker, preserving its existing portfolio callback. It does not create another login application.

Set `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET` for the Terraform Management API application. Supply `TF_VAR_production_origin` as the deployed app's HTTPS origin. Do not commit credentials or Terraform state; use a protected remote backend before applying against production.

For local use, put the provider credentials in the ignored `.env.local` file in this directory, set `AUTH0_DOMAIN` to your tenant domain, then load it with `source .env.local` from this directory before running Terraform. Keep this file local and out of Git.

Run `terraform init`, `terraform fmt -check`, `terraform validate`, then `terraform plan`. Inspect the import and planned updates to the existing application before applying. The Management API application needs read and update permissions for clients, client credentials, connections, and branding resources. After apply, set the Next.js app's `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID` (the `auth0_client_id` output), and `AUTH0_CLIENT_SECRET` (the web application's secret), plus `MCP_PUBLIC_ORIGIN` matching `production_origin` in production. For local sign-in, set `MCP_PUBLIC_ORIGIN=http://localhost:3000`.

The Auth0 callback is on the Next.js app. The separate MCP client's OAuth callback defaults to `http://localhost:<port>/callback`.

## Branded login and social connections

Set `TF_VAR_login_domain` only to a hostname whose DNS you control (for example `login.example.com`). Apply the custom domain resource, add the DNS record shown in `login_domain_verification`, then set `TF_VAR_verify_login_domain=true` and apply again. Once Auth0 reports the domain ready, use that hostname as the Next.js runtime `AUTH0_DOMAIN`; the Terraform provider should continue using the canonical `*.auth0.com` tenant hostname. A `vercel.app` hostname cannot be delegated to Auth0 unless you control its DNS.

`TF_VAR_login_logo_url` and `TF_VAR_login_primary_color` optionally configure basic tenant-wide Universal Login branding. Review the existing tenant branding before setting them; branding affects the whole Auth0 tenant.

The existing Google connection is already enabled for the web application. If it uses Auth0 development keys, configure your own Google OAuth credentials before using a custom domain. To add GitHub, create a GitHub OAuth application with callback `https://<runtime-auth0-domain>/login/callback`, then set both `TF_VAR_github_client_id` and `TF_VAR_github_client_secret`. Keep those values out of Git.
