/**
 * Plain text for DB search: walk Lexical serialized JSON and collect `text`
 * from every node with type === "text".
 */
export function extractPlainText(content: string): string {
  if (typeof content !== "string" || !content.trim()) return "";

  let root: unknown;
  try {
    root = JSON.parse(content) as unknown;
  } catch {
    return "";
  }

  const parts: string[] = [];

  function walk(node: unknown): void {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object") return;

    const obj = node as Record<string, unknown>;
    if (obj.type === "text" && typeof obj.text === "string") {
      parts.push(obj.text);
    }

    for (const value of Object.values(obj)) {
      walk(value);
    }
  }

  walk(root);
  return parts.join(" ");
}

export const lexicalJsonToSearchText = extractPlainText;
