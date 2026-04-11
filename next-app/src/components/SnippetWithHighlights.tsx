"use client";

import { KeywordHighlight } from "@/components/KeywordHighlight";

/** Thin wrapper: yellow highlights + muted body text for snippets. */
export function SnippetWithHighlights({
  text,
  keywords,
}: {
  text: string;
  keywords: readonly string[];
}) {
  return (
    <KeywordHighlight
      text={text}
      keywords={keywords}
      variant="yellow"
      className="text-neutral-500"
    />
  );
}
