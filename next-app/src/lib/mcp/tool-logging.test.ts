import assert from "node:assert/strict";
import test from "node:test";
import type { ServerContext } from "@modelcontextprotocol/server";
import { loggedToolCall } from "./tool-logging";

test("logs completed tool calls without arguments or token", async () => {
  const calls: unknown[] = [];
  const originalInfo = console.info;
  console.info = (...args) => { calls.push(args); };
  try {
    const context = { http: { authInfo: { token: "secret", clientId: "domkatsu-mcp", scopes: ["mcp:read"], extra: { oauthUserId: "user-1" } } } } as unknown as ServerContext;
    const result = await loggedToolCall("get_project", context, async () => ({ isError: false, content: [] }));
    assert.deepEqual(result.content, []);
    assert.equal(calls.length, 1);
    assert.deepEqual(Object.keys((calls[0] as unknown[])[1] as object).sort(), ["clientId", "durationMs", "oauthUserId", "outcome", "tool"]);
    assert.equal(JSON.stringify(calls).includes("secret"), false);
  } finally {
    console.info = originalInfo;
  }
});
