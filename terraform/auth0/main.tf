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

output "auth0_client_id" {
  value = auth0_client.mcp_login.client_id
}
