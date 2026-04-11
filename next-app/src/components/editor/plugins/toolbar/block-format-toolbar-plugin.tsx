import { $isListNode, ListNode } from "@lexical/list"
import { $isHeadingNode } from "@lexical/rich-text"
import { $findMatchingParent, $getNearestNodeOfType } from "@lexical/utils"
import { $isRangeSelection, $isRootOrShadowRoot, BaseSelection } from "lexical"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"
import { blockTypeToBlockName } from "@/components/editor/plugins/toolbar/block-format/block-format-data"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
} from "@/components/ui/select"

export function BlockFormatDropDown({
  children,
}: {
  children: React.ReactNode
}) {
  const { activeEditor, blockType, setBlockType } = useToolbarContext()

  function $updateToolbar(selection: BaseSelection) {
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode()
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent()
              return parent !== null && $isRootOrShadowRoot(parent)
            })

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow()
      }

      const elementKey = element.getKey()
      const elementDOM = activeEditor.getElementByKey(elementKey)

      if (elementDOM !== null) {
        // setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode
          )
          const type = parentList
            ? parentList.getListType()
            : element.getListType()
          setBlockType(type)
        } else {
          let type: string = $isHeadingNode(element)
            ? element.getTag()
            : element.getType()
          if (type === "h3") type = "h2"
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName)
          }
        }
      }
    }
  }

  useUpdateToolbarHandler($updateToolbar)

  return (
    <Select
      value={blockType}
      onValueChange={(value) => {
        setBlockType(value as keyof typeof blockTypeToBlockName)
      }}
    >
      <SelectTrigger
        type="button"
        className="!h-8 w-min min-w-[8rem] cursor-pointer gap-1"
      >
        {blockTypeToBlockName[blockType]?.icon}
        <span>{blockTypeToBlockName[blockType]?.label ?? "Paragraph"}</span>
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={4}
        className="editor-toolbar-dropdown z-[100] max-h-[var(--radix-select-content-available-height)] bg-white text-zinc-900 border-zinc-200"
      >
        <SelectGroup>{children}</SelectGroup>
      </SelectContent>
    </Select>
  )
}
