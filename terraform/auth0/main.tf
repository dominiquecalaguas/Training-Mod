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

variable "google_client_id" {
  type      = string
  sensitive = true
}

variable "google_client_secret" {
  type      = string
  sensitive = true
}

variable "github_client_id" {
  type      = string
  sensitive = true
}

variable "github_client_secret" {
  type      = string
  sensitive = true
}

resource "auth0_client" "mcp_login" {
  name            = "Domkatsu MCP Login"
  app_type        = "regular_web"
  is_first_party  = true
  oidc_conformant = true
  grant_types     = ["authorization_code"]
  callbacks = [
    "${var.production_origin}/oauth/auth0/callback",
    "http://localhost:3000/oauth/auth0/callback",
  ]
}

resource "auth0_client_credentials" "mcp_login" {
  client_id             = auth0_client.mcp_login.id
  authentication_method = "client_secret_post"
}

resource "auth0_connection" "google" {
  name     = "domkatsu-google"
  strategy = "google-oauth2"

  options {
    client_id     = var.google_client_id
    client_secret = var.google_client_secret
    scopes        = ["email", "profile"]
  }
}

resource "auth0_connection" "github" {
  name     = "domkatsu-github"
  strategy = "github"

  options {
    client_id     = var.github_client_id
    client_secret = var.github_client_secret
    scopes        = ["email"]
  }
}

resource "auth0_connection_client" "google_mcp_login" {
  connection_id = auth0_connection.google.id
  client_id     = auth0_client.mcp_login.id
}

resource "auth0_connection_client" "github_mcp_login" {
  connection_id = auth0_connection.github.id
  client_id     = auth0_client.mcp_login.id
}

output "auth0_client_id" {
  value = auth0_client.mcp_login.client_id
}
