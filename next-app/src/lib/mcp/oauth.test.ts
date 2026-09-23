import assert from "node:assert/strict";
import test from "node:test";
import { challenge, matchesChallenge, sha256, validClientRedirect } from "./oauth";

test("localhost callbacks keep their exact path while allowing varying ports", () => {
  assert.equal(validClientRedirect("http://localhost:3000/callback"), true);
  assert.equal(validClientRedirect("http://localhost:47291/callback"), true);
  assert.equal(validClientRedirect("http://localhost:3000/other"), false);
  assert.equal(validClientRedirect("http://127.0.0.1:3000/callback"), false);
  assert.equal(validClientRedirect("https://example.com/callback"), false);
  assert.equal(validClientRedirect("http://localhost:3000/callback?next=https://example.com"), false);
});

test("PKCE and stored token hashes use SHA-256", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  assert.equal(challenge(verifier), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  assert.equal(matchesChallenge(verifier, challenge(verifier)), true);
  assert.equal(matchesChallenge(`${verifier}x`, challenge(verifier)), false);
  assert.equal(sha256("token").length, 64);
});
