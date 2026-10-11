# MCP Auth0 configuration

This configuration adopts the existing Dominique's Web Portfolio Auth0 application and its Google connection. Terraform changes that application to a confidential Regular Web application for the MCP login broker, preserving its existing portfolio callback. It does not create another login application.

Set `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET` for the Terraform Management API application. Supply `TF_VAR_production_origin` as the deployed app's HTTPS origin. Do not commit credentials or Terraform state; use a protected remote backend before applying against production.

For local use, put the provider credentials in the ignored `.env.local` file in this directory, set `AUTH0_DOMAIN` to your tenant domain, then load it with `source .env.local` from this directory before running Terraform. Keep this file local and out of Git.

Run `terraform init`, `terraform fmt -check`, `terraform validate`, then `terraform plan`. Inspect the import and planned updates to the existing application before applying. The Management API application needs read and update permissions for clients, client credentials, connections, and branding resources. After apply, set the Next.js app's `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID` (the `auth0_client_id` output), and `AUTH0_CLIENT_SECRET` (the web application's secret), plus `MCP_PUBLIC_ORIGIN` matching `production_origin` in production. For local sign-in, set `MCP_PUBLIC_ORIGIN=http://localhost:3000`.

The Auth0 callback is on the Next.js app. The separate MCP client's OAuth callback defaults to `http://localhost:<port>/callback`.
