import assert from "node:assert/strict";
import test from "node:test";
import { auth0StateCookie, bearerToken, challenge, CLAUDE_CLIENT_ID, CLAUDE_REDIRECT_URI, matchesAuth0StateCookie, matchesChallenge, MCP_CLIENT_ID, sha256, validClientRedirect } from "./oauth";

test("localhost callbacks keep their exact path while allowing varying ports", () => {
  assert.equal(validClientRedirect(MCP_CLIENT_ID, "http://localhost:3000/callback"), true);
  assert.equal(validClientRedirect(MCP_CLIENT_ID, "http://localhost:47291/callback"), true);
  assert.equal(validClientRedirect(MCP_CLIENT_ID, "http://localhost:3000/other"), false);
  assert.equal(validClientRedirect(MCP_CLIENT_ID, "http://127.0.0.1:3000/callback"), false);
  assert.equal(validClientRedirect(MCP_CLIENT_ID, "https://example.com/callback"), false);
  assert.equal(validClientRedirect(MCP_CLIENT_ID, "http://localhost:3000/callback?next=https://example.com"), false);
  assert.equal(validClientRedirect(CLAUDE_CLIENT_ID, CLAUDE_REDIRECT_URI), true);
  assert.equal(validClientRedirect(CLAUDE_CLIENT_ID, `${CLAUDE_REDIRECT_URI}?next=https://example.com`), false);
  assert.equal(validClientRedirect(CLAUDE_CLIENT_ID, "http://localhost:3000/callback"), false);
  assert.equal(validClientRedirect("unknown", CLAUDE_REDIRECT_URI), false);
});

test("PKCE and stored token hashes use SHA-256", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  assert.equal(challenge(verifier), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  assert.equal(matchesChallenge(verifier, challenge(verifier)), true);
  assert.equal(matchesChallenge(`${verifier}x`, challenge(verifier)), false);
  assert.equal(sha256("token").length, 64);
});

test("Auth0 callback state must match the initiating browser cookie", () => {
  process.env.MCP_PUBLIC_ORIGIN = "https://example.com";
  const state = "a".repeat(43);
  const cookie = auth0StateCookie(state);
  assert.match(cookie, /HttpOnly; SameSite=Lax; Max-Age=600; Secure/);
  assert.equal(matchesAuth0StateCookie(new Request("https://example.com/oauth/auth0/callback", { headers: { cookie } }), state), true);
  assert.equal(matchesAuth0StateCookie(new Request("https://example.com/oauth/auth0/callback", { headers: { cookie } }), "b".repeat(43)), false);
  assert.match(auth0StateCookie(state, true), /Max-Age=0/);
});

test("MCP accepts only a bearer credential in the authorization header", () => {
  const token = "a".repeat(43);
  assert.equal(bearerToken(new Request("https://example.com/mcp", { headers: { Authorization: `Bearer ${token}` } })), token);
  assert.equal(bearerToken(new Request("https://example.com/mcp", { headers: { Authorization: `Basic ${token}` } })), null);
  assert.equal(bearerToken(new Request(`https://example.com/mcp?access_token=${token}`)), null);
});
