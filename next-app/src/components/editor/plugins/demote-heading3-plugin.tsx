"use client"

import { useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $createHeadingNode, HeadingNode } from "@lexical/rich-text"
import type { LexicalNode } from "lexical"

/**
 * Converts any h3 blocks to h2 so Heading 3 is not a supported path (markdown, paste, or legacy JSON).
 */
export function DemoteHeading3Plugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerNodeTransform(HeadingNode, (node) => {
      if (node.getTag() !== "h3") return
      const replacement = $createHeadingNode("h2")
      const children = node.getChildren<LexicalNode>()
      for (const child of children) {
        replacement.append(child)
      }
      node.replace(replacement)
    })
  }, [editor])

  return null
}
