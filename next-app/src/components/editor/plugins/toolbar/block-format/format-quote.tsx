import { $createQuoteNode } from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import { $getSelection, $isRangeSelection } from "lexical"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { blockTypeToBlockName } from "@/components/editor/plugins/toolbar/block-format/block-format-data"
import { SelectItem } from "@/components/ui/select"

const BLOCK_FORMAT_VALUE = "quote"

export function FormatQuote() {
  const { activeEditor, blockType } = useToolbarContext()

  const formatQuote = () => {
    if (blockType !== "quote") {
      activeEditor.update(() => {
        const selection = $getSelection()
        if (selection && $isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      })
    }
  }

  return (
    <SelectItem
      value="quote"
      onPointerDown={(e) => {
        e.preventDefault()
        formatQuote()
      }}
    >
      <div className="flex items-center gap-1 font-normal">
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE].icon}
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE].label}
      </div>
    </SelectItem>
  )
}
