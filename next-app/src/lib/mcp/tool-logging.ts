import type { ServerContext } from "@modelcontextprotocol/server";

export async function loggedToolCall<Result extends object>(
  tool: string,
  context: ServerContext,
  run: () => Promise<Result>,
) {
  const startedAt = performance.now();
  const authInfo = context.http?.authInfo;
  const identity = {
    tool,
    oauthUserId: authInfo?.extra?.oauthUserId,
    clientId: authInfo?.clientId,
  };

  try {
    const result = await run();
    console.info("MCP tool call", {
      ...identity,
      outcome: "isError" in result && result.isError === true ? "error" : "success",
      durationMs: Math.round(performance.now() - startedAt),
    });
    return result;
  } catch (error) {
    console.error("MCP tool call", {
      ...identity,
      outcome: "error",
      durationMs: Math.round(performance.now() - startedAt),
    });
    throw error;
  }
}
