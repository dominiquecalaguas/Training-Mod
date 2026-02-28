"use client"

import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { INSERT_EMBED_COMMAND } from "@lexical/react/LexicalAutoEmbedPlugin"
import { useState } from "react"
import {
  ChevronDownIcon,
  Columns3Icon,
  ImageIcon,
  MinusIcon,
  PlusIcon,
  TableIcon,
} from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { EmbedConfigs } from "@/components/editor/plugins/embeds/auto-embed-plugin"
import { InsertImageDialog } from "@/components/editor/plugins/images-plugin"
import { InsertLayoutDialog } from "@/components/editor/plugins/layout-plugin"
import { InsertTableDialog } from "@/components/editor/plugins/table-plugin"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function BlockInsertPlugin({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const { activeEditor, showModal } = useToolbarContext()

  const closeAnd = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className="!h-8 w-min gap-1 rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm font-medium text-zinc-900 shadow-xs hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-zinc-400 inline-flex items-center justify-center outline-none"
      >
        <PlusIcon className="size-4" />
        <span>Insert</span>
        <ChevronDownIcon className="size-4 shrink-0 opacity-60" />
      </PopoverTrigger>
      <PopoverContent
        className="editor-toolbar-dropdown w-52 bg-white p-1 text-zinc-900 border-zinc-200"
        align="start"
      >
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() =>
              closeAnd(() =>
                showModal("Insert Image", (onClose) => (
                  <InsertImageDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ))
              )
            }
            className="flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm outline-none hover:bg-zinc-100"
          >
            <ImageIcon className="size-4" />
            <span>Image</span>
          </button>
          <button
            type="button"
            onClick={() =>
              closeAnd(() =>
                activeEditor.dispatchCommand(
                  INSERT_HORIZONTAL_RULE_COMMAND,
                  undefined
                )
              )
            }
            className="flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm outline-none hover:bg-zinc-100"
          >
            <MinusIcon className="size-4" />
            <span>Horizontal Rule</span>
          </button>
          <button
            type="button"
            onClick={() =>
              closeAnd(() =>
                showModal("Insert Table", (onClose) => (
                  <InsertTableDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ))
              )
            }
            className="flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm outline-none hover:bg-zinc-100"
          >
            <TableIcon className="size-4" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() =>
              closeAnd(() =>
                showModal("Insert Columns Layout", (onClose) => (
                  <InsertLayoutDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ))
              )
            }
            className="flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm outline-none hover:bg-zinc-100"
          >
            <Columns3Icon className="size-4" />
            <span>Columns Layout</span>
          </button>
          {EmbedConfigs.filter(
            (c) => c.type !== "tweet" && c.type !== "youtube-video"
          ).map((embedConfig) => (
            <button
              key={embedConfig.type}
              type="button"
              onClick={() =>
                closeAnd(() =>
                  activeEditor.dispatchCommand(
                    INSERT_EMBED_COMMAND,
                    embedConfig.type
                  )
                )
              }
              className="flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-2 text-sm outline-none hover:bg-zinc-100"
            >
              {embedConfig.icon}
              <span>{embedConfig.contentName}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
