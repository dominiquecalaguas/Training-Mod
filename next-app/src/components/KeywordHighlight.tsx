"use client";

import { Fragment } from "react";

const MARK_CLASS: Record<"yellow" | "blue", string> = {
  yellow:
    "rounded-sm bg-[#eab308] px-0.5 font-medium text-neutral-900",
  blue: "bg-transparent font-semibold text-[#4468D2]",
};

/**
 * Highlights search keywords (longest first, escaped regex).
 * Yellow variant matches Skool-style emphasis on light backgrounds.
 */
export function KeywordHighlight({
  text,
  keywords,
  variant = "yellow",
  className,
}: {
  text: string;
  keywords: readonly string[];
  variant?: "yellow" | "blue";
  /** Applied to the outer wrapper around text (and non-match segments). */
  className?: string;
}) {
  const kw = [...new Set(keywords.filter((k) => k.length > 0))].sort(
    (a, b) => b.length - a.length,
  );

  if (!text) return null;

  if (kw.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const escaped = kw.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(re);
  const markClass = MARK_CLASS[variant];

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const hit = kw.find((k) => part.toLowerCase() === k);
        if (hit !== undefined) {
          return (
            <mark key={i} className={`${markClass} [text-decoration:none]`}>
              {part}
            </mark>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
}
