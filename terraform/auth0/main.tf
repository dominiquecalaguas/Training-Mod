terraform {
  required_version = ">= 1.11.0"

  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = ">= 1.29.0, < 2.0.0"
    }
  }
}

provider "auth0" {}

variable "production_origin" {
  type        = string
  description = "HTTPS origin of the deployed Next.js app, without a trailing slash."
}

variable "login_domain" {
  type        = string
  default     = null
  description = "Optional branded Auth0 login hostname, such as login.example.com."
}

variable "verify_login_domain" {
  type        = bool
  default     = false
  description = "Verify the custom domain after its Auth0 DNS record is in place."
}

variable "login_logo_url" {
  type        = string
  default     = null
  description = "Optional publicly accessible logo URL for Universal Login."
}

variable "login_primary_color" {
  type        = string
  default     = null
  description = "Optional six-digit primary color for Universal Login, such as #0059d6."
}

variable "github_client_id" {
  type        = string
  default     = null
  description = "GitHub OAuth application client ID; set with github_client_secret."
}

variable "github_client_secret" {
  type        = string
  default     = null
  sensitive   = true
  description = "GitHub OAuth application client secret; set with github_client_id."
}

check "github_credentials" {
  assert {
    condition     = (var.github_client_id == null) == (var.github_client_secret == null)
    error_message = "Set both GitHub OAuth credentials, or neither."
  }
}

resource "auth0_custom_domain" "login" {
  count      = var.login_domain == null ? 0 : 1
  domain     = var.login_domain
  type       = "auth0_managed_certs"
  tls_policy = "recommended"
}

resource "auth0_custom_domain_verification" "login" {
  count            = var.login_domain != null && var.verify_login_domain ? 1 : 0
  custom_domain_id = auth0_custom_domain.login[0].id

  timeouts { create = "15m" }
}

output "login_domain_verification" {
  value       = var.login_domain == null ? null : auth0_custom_domain.login[0].verification
  description = "Add the DNS verification record shown here, then verify the custom domain in Auth0."
}

resource "auth0_branding" "login" {
  count    = var.login_logo_url == null && var.login_primary_color == null ? 0 : 1
  logo_url = var.login_logo_url

  dynamic "colors" {
    for_each = var.login_primary_color == null ? [] : [var.login_primary_color]
    content {
      primary         = colors.value
      page_background = "#ffffff"
    }
  }
}

resource "auth0_client" "mcp_login" {
  name            = "Dominique's Web Portfolio"
  app_type        = "regular_web"
  is_first_party  = true
  oidc_conformant = true
  grant_types     = ["authorization_code"]
  callbacks = [
    "https://training-mod-three.vercel.app/",
    "${var.production_origin}/oauth/auth0/callback",
    "http://localhost:3000/oauth/auth0/callback",
  ]
  allowed_logout_urls = ["https://training-mod-three.vercel.app/"]
  web_origins         = ["https://training-mod-three.vercel.app/"]
}

import {
  to = auth0_client.mcp_login
  id = "s03JHbzj8E3dhTRcZg7S5nC82fCcAw7t"
}

resource "auth0_client_credentials" "mcp_login" {
  client_id             = auth0_client.mcp_login.id
  authentication_method = "client_secret_post"
}

import {
  to = auth0_client_credentials.mcp_login
  id = "s03JHbzj8E3dhTRcZg7S5nC82fCcAw7t"
}

data "auth0_connection" "google" {
  connection_id        = "con_l4K3tQD2wpVFoSQn"
  hide_client_secret   = true
  skip_enabled_clients = true
}

resource "auth0_connection_client" "google_mcp_login" {
  connection_id = data.auth0_connection.google.id
  client_id     = auth0_client.mcp_login.id
}

import {
  to = auth0_connection_client.google_mcp_login
  id = "con_l4K3tQD2wpVFoSQn::s03JHbzj8E3dhTRcZg7S5nC82fCcAw7t"
}

resource "auth0_connection" "github" {
  count    = var.github_client_id == null ? 0 : 1
  name     = "domkatsu-github"
  strategy = "github"

  options {
    client_id     = var.github_client_id
    client_secret = var.github_client_secret
    scopes        = ["email", "profile"]
  }
}

resource "auth0_connection_client" "github_mcp_login" {
  count         = var.github_client_id == null ? 0 : 1
  connection_id = auth0_connection.github[0].id
  client_id     = auth0_client.mcp_login.id
}

output "auth0_client_id" {
  value = auth0_client.mcp_login.client_id
}
