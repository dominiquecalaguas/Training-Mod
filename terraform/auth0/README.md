# MCP Auth0 configuration

Create an Auth0 tenant, a Management API application for Terraform, and Google and GitHub OAuth applications. Configure the social providers' callback URLs as `https://<auth0-domain>/login/callback`.

Set `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET` for the Terraform provider. Supply `TF_VAR_production_origin` as the deployed app's HTTPS origin and the four sensitive `TF_VAR_google_client_id`, `TF_VAR_google_client_secret`, `TF_VAR_github_client_id`, and `TF_VAR_github_client_secret` values. Do not commit values or Terraform state; use a protected remote backend before applying against production.

Run `terraform init`, `terraform fmt -check`, `terraform validate`, then `terraform plan`. After apply, set the Next.js app's `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID` (the `auth0_client_id` output), and `AUTH0_CLIENT_SECRET` (from the Auth0 application credentials), plus `MCP_PUBLIC_ORIGIN` matching `production_origin` in production. For local sign-in, set `MCP_PUBLIC_ORIGIN=http://localhost:3000`.

The Auth0 callback is on the Next.js app. The separate MCP client's OAuth callback defaults to `http://localhost:<port>/callback`.
