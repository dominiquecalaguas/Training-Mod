"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { JSX, useEffect, useRef, useState } from "react"
import * as React from "react"
import { createPortal } from "react-dom"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils"
import {
  $createParagraphNode,
  $createRangeSelection,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
  NodeKey,
} from "lexical"

import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  ImagePayload,
} from "@/components/editor/nodes/image-node"
import { CAN_USE_DOM } from "@/components/editor/shared/can-use-dom"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CloudUpload, X } from "lucide-react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export type InsertImagePayload = Readonly<ImagePayload>

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND")

const TRANSPARENT_DRAG_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

/** Drag hotspot inside the preview: top-left-ish so the ghost sits down-right of the pointer and does not cover the drop caret. */
const DRAG_GHOST_HOTSPOT_X = 14
const DRAG_GHOST_HOTSPOT_Y = 22

function dragGhostHotspot(w: number, h: number): [number, number] {
  const x = Math.min(DRAG_GHOST_HOTSPOT_X, Math.max(0, w - 2))
  const y = Math.min(DRAG_GHOST_HOTSPOT_Y, Math.max(0, h - 2))
  return [Math.round(x), Math.round(y)]
}

/** Viewport-fixed I-beam at the same spot as `caretRangeFromPoint` / drop insertion. */
type DropCaretRect = {
  height: number
  left: number
  top: number
}

let imageDragGhostEl: HTMLElement | null = null

function removeImageDragGhost(): void {
  if (imageDragGhostEl?.isConnected) {
    imageDragGhostEl.remove()
  }
  imageDragGhostEl = null
}

let setImageDropCaret: ((rect: DropCaretRect | null) => void) | null = null

function setLexicalImageDropCaret(rect: DropCaretRect | null): void {
  setImageDropCaret?.(rect)
}

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest("code") &&
    target.closest("div.ContentEditable__root")
  )
}

/** Same range logic as drop (`getDragSelection`); used so the indicator matches insertion. */
function getDropRangeFromEvent(event: DragEvent): Range | null {
  const target = event.target as null | Element | Document
  const targetWindow =
    target == null
      ? null
      : target.nodeType === 9
        ? (target as Document).defaultView
        : (target as Element).ownerDocument.defaultView
  const domSelection = getDOMSelection(targetWindow)
  if (document.caretRangeFromPoint) {
    return document.caretRangeFromPoint(event.clientX, event.clientY) ?? null
  }
  if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0)
    return domSelection.getRangeAt(0)
  }
  return null
}

function caretGeometryFromRange(
  range: Range,
  clientY: number,
  root: HTMLElement
): { left: number; top: number; height: number } | null {
  const rects = [...range.getClientRects()].filter(
    (r) => r.width >= 0 && r.height > 0
  )
  let r: DOMRect | null = null
  if (rects.length === 0) {
    const b = range.getBoundingClientRect()
    if (b.height > 0 || b.width > 0) {
      r = b
    }
  } else if (rects.length === 1) {
    r = rects[0]!
  } else {
    let best = rects[0]!
    let bestDist = Infinity
    for (const rect of rects) {
      const mid = rect.top + rect.height / 2
      const d = Math.abs(clientY - mid)
      if (d < bestDist) {
        bestDist = d
        best = rect
      }
    }
    r = best
  }

  if (!r || (r.height <= 0 && r.width <= 0)) {
    const sc = range.startContainer
    const el =
      sc.nodeType === Node.TEXT_NODE
        ? sc.parentElement
        : (sc as Element | null)
    if (el?.getBoundingClientRect) {
      const br = el.getBoundingClientRect()
      if (br.height > 0) {
        r = br
      }
    }
  }

  if (!r) {
    return null
  }

  const fontSize = parseFloat(getComputedStyle(root).fontSize) || 16
  const height = Math.max(r.height, fontSize * 0.9)

  return { left: r.left, top: r.top, height }
}

function computeDropCaretRect(
  event: DragEvent,
  editor: LexicalEditor
): DropCaretRect | null {
  const root = editor.getRootElement()
  if (!root || !canDropImage(event)) {
    return null
  }

  const range = getDropRangeFromEvent(event)
  if (!range || !root.contains(range.startContainer)) {
    return null
  }

  const geom = caretGeometryFromRange(range, event.clientY, root)
  if (!geom) {
    return null
  }

  return {
    left: geom.left,
    top: geom.top,
    height: geom.height,
  }
}

function ImageDropCaretOverlay(): JSX.Element | null {
  const [caret, setCaret] = useState<DropCaretRect | null>(null)

  useEffect(() => {
    setImageDropCaret = setCaret
    return () => {
      setImageDropCaret = null
    }
  }, [])

  useEffect(() => {
    const onDragEnd = () => {
      removeImageDragGhost()
      setCaret(null)
    }
    document.addEventListener("dragend", onDragEnd)
    return () => document.removeEventListener("dragend", onDragEnd)
  }, [])

  if (!caret) {
    return null
  }

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed z-[10001] w-0.5 animate-pulse rounded-sm bg-primary shadow-[0_0_0_1px_hsl(var(--background))]"
      style={{
        left: caret.left,
        top: caret.top,
        height: caret.height,
      }}
    />,
    document.body
  )
}

export function InsertImageUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void
}) {
  const [src, setSrc] = useState("")

  const isDisabled = src === ""

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="image-url">Image URL</Label>
        <Input
          id="image-url"
          placeholder="i.e. https://source.unsplash.com/random"
          onChange={(e) => setSrc(e.target.value)}
          value={src}
          data-test-id="image-modal-url-input"
        />
      </div>
      <DialogFooter>
        <Button
          type="submit"
          disabled={isDisabled}
          onClick={() => onClick({ altText: "", src })}
          data-test-id="image-modal-confirm-btn"
        >
          Confirm
        </Button>
      </DialogFooter>
    </div>
  )
}

function processImageFile(file: File | null, setSrc: (s: string) => void) {
  if (file == null || !file.type.startsWith("image/")) return
  const reader = new FileReader()
  reader.onload = function () {
    if (typeof reader.result === "string") setSrc(reader.result)
  }
  reader.readAsDataURL(file)
}

export function InsertImageUploadedDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void
}) {
  const [src, setSrc] = useState("")
  const [fileName, setFileName] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isDisabled = src === ""

  const handleFiles = (files: FileList | null) => {
    if (files?.length) {
      setFileName(files[0].name)
      processImageFile(files[0], setSrc)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setFileName(file.name)
      processImageFile(file, setSrc)
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const related = e.relatedTarget as Node | null
    if (!related || !e.currentTarget.contains(related)) setIsDragging(false)
  }

  const clearImage = () => {
    setSrc("")
    setFileName("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label>Image</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          data-test-id="image-modal-file-upload"
        />
        {src ? (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <img
              src={src}
              alt=""
              className="size-16 shrink-0 rounded-md border border-zinc-200 object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">
              {fileName || "Image"}
            </span>
            <button
              type="button"
              onClick={clearImage}
              className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              "-mt-[25px] flex min-h-[185px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
              isDragging
                ? "border-zinc-400 bg-zinc-100"
                : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50"
            )}
          >
            <CloudUpload className="size-10 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-900">
              Drag & drop to upload
            </span>
            <span className="text-xs text-zinc-500">or browse</span>
          </button>
        )}
      </div>
      <DialogFooter>
        <Button
          type="button"
          disabled={isDisabled}
          onClick={() => onClick({ altText: "", src })}
          data-test-id="image-modal-file-upload-btn"
        >
          Insert image
        </Button>
      </DialogFooter>
    </div>
  )
}

export function InsertImageDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor
  onClose: () => void
}): JSX.Element {
  const hasModifier = useRef(false)

  useEffect(() => {
    hasModifier.current = false
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey
    }
    document.addEventListener("keydown", handler)
    return () => {
      document.removeEventListener("keydown", handler)
    }
  }, [activeEditor])

  const onClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload)
    onClose()
  }

  return (
    <Tabs defaultValue="file">
      <TabsList className="w-full">
        <TabsTrigger value="file" className="w-full">
          File
        </TabsTrigger>
        <TabsTrigger value="url" className="w-full">
          URL
        </TabsTrigger>
      </TabsList>
      <TabsContent value="file">
        <InsertImageUploadedDialogBody onClick={onClick} />
      </TabsContent>
      <TabsContent value="url">
        <InsertImageUriDialogBody onClick={onClick} />
      </TabsContent>
    </Tabs>
  )
}

export function ImagesPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode not registered on editor")
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload)
          $insertNodes([imageNode])
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return $onDragStart(event, editor)
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event, editor)
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor)
        },
        COMMAND_PRIORITY_HIGH
      )
    )
  }, [captionsEnabled, editor])

  return <ImageDropCaretOverlay />
}

type LexicalImageDragData = InsertImagePayload & { key: NodeKey }

function $serializeImageForDrag(node: ImageNode): LexicalImageDragData {
  const json = node.exportJSON()
  return {
    key: node.getKey(),
    src: json.src,
    altText: json.altText,
    maxWidth: json.maxWidth,
    showCaption: json.showCaption,
    width: json.width === 0 ? undefined : json.width,
    height: json.height === 0 ? undefined : json.height,
  }
}

function $payloadForInsertFromDrag(data: LexicalImageDragData): InsertImagePayload {
  const { key: _omit, ...rest } = data
  return rest
}

function $onDragStart(event: DragEvent, editor: LexicalEditor): boolean {
  const node = $getImageNodeInSelection()
  if (!node) {
    return false
  }
  const dataTransfer = event.dataTransfer
  if (!dataTransfer) {
    return false
  }

  removeImageDragGhost()
  dataTransfer.setData("text/plain", "_")

  const serializable = $serializeImageForDrag(node)
  dataTransfer.setData(
    "application/x-lexical-drag",
    JSON.stringify({
      data: serializable,
      type: "image",
    })
  )

  const setFallbackDragImage = () => {
    const img = document.createElement("img")
    img.src = TRANSPARENT_DRAG_IMAGE
    document.body.appendChild(img)
    img.style.position = "fixed"
    img.style.left = "-9999px"
    dataTransfer.setDragImage(img, 0, 0)
    imageDragGhostEl = img
  }

  const dom = editor.getElementByKey(node.getKey())
  const sourceImg = dom?.querySelector("img")
  if (sourceImg) {
    const clone = sourceImg.cloneNode(true) as HTMLImageElement
    clone.removeAttribute("width")
    clone.removeAttribute("height")
    clone.style.maxWidth = "120px"
    clone.style.width = "auto"
    clone.style.height = "auto"
    clone.style.borderRadius = "8px"
    clone.style.boxShadow = "0 4px 12px rgba(0,0,0,0.18)"
    clone.draggable = false

    const wrapper = document.createElement("div")
    wrapper.style.position = "fixed"
    wrapper.style.left = "-9999px"
    wrapper.style.top = "0"
    wrapper.style.zIndex = "10000"
    wrapper.appendChild(clone)
    document.body.appendChild(wrapper)
    const w = Math.max(wrapper.offsetWidth, 48)
    const h = Math.max(wrapper.offsetHeight, 36)
    const [hx, hy] = dragGhostHotspot(w, h)
    dataTransfer.setDragImage(wrapper, hx, hy)
    imageDragGhostEl = wrapper
  } else {
    const pre = new Image()
    pre.src = node.getSrc()
    if (pre.complete && pre.naturalWidth > 0) {
      pre.style.maxWidth = "120px"
      pre.style.borderRadius = "8px"
      pre.style.boxShadow = "0 4px 12px rgba(0,0,0,0.18)"
      const wrapper = document.createElement("div")
      wrapper.style.position = "fixed"
      wrapper.style.left = "-9999px"
      wrapper.style.top = "0"
      wrapper.style.zIndex = "10000"
      wrapper.appendChild(pre)
      document.body.appendChild(wrapper)
      const w = Math.max(wrapper.offsetWidth, 48)
      const h = Math.max(wrapper.offsetHeight, 36)
      const [hx, hy] = dragGhostHotspot(w, h)
      dataTransfer.setDragImage(wrapper, hx, hy)
      imageDragGhostEl = wrapper
    } else {
      setFallbackDragImage()
    }
  }

  return true
}

function $onDragover(event: DragEvent, editor: LexicalEditor): boolean {
  const types = event.dataTransfer?.types
  if (!types || !Array.from(types).includes("application/x-lexical-drag")) {
    setLexicalImageDropCaret(null)
    return false
  }
  if (canDropImage(event)) {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    setLexicalImageDropCaret(computeDropCaretRect(event, editor))
  } else {
    setLexicalImageDropCaret(null)
  }
  return true
}

function $onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const data = getDragImageData(event)
  if (!data || typeof data.key !== "string") {
    return false
  }
  event.preventDefault()
  if (!canDropImage(event)) {
    setLexicalImageDropCaret(null)
    return true
  }

  setLexicalImageDropCaret(null)

  editor.update(() => {
    const existing = $getNodeByKey(data.key)
    if ($isImageNode(existing)) {
      existing.remove()
    }
    const range = getDragSelection(event)
    const rangeSelection = $createRangeSelection()
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range)
    }
    $setSelection(rangeSelection)
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, $payloadForInsertFromDrag(data))
  })
  return true
}

function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes[0]
  return $isImageNode(node) ? node : null
}

function getDragImageData(event: DragEvent): null | LexicalImageDragData {
  const dragData = event.dataTransfer?.getData("application/x-lexical-drag")
  if (!dragData) {
    return null
  }
  try {
    const { type, data } = JSON.parse(dragData) as {
      type: string
      data: LexicalImageDragData
    }
    if (type !== "image" || data == null || typeof data.key !== "string") {
      return null
    }
    return data
  } catch {
    return null
  }
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  const range = getDropRangeFromEvent(event)
  if (!range) {
    throw Error(`Cannot get the selection when dragging`)
  }
  return range
}
