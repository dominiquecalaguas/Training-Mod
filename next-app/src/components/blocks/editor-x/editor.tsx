"use client"

import { useRef } from "react"
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { EditorState, SerializedEditorState } from "lexical"

import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"
import { Plugins } from "./plugins"

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  editable: true,
  onError: (error: Error) => {
    console.error(error)
  },
}

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
}: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
}) {
  // Use initial serialized state only on first mount so parent state updates
  // don't re-apply and block focus/typing
  const initialSerializedRef = useRef<SerializedEditorState | undefined>(
    editorSerializedState
  )
  const configRef = useRef<InitialConfigType | null>(null)
  if (configRef.current === null) {
    configRef.current = {
      ...editorConfig,
      ...(editorState ? { editorState } : {}),
      ...(initialSerializedRef.current
        ? { editorState: JSON.stringify(initialSerializedRef.current) }
        : {}),
    }
  }

  return (
    <div className="rounded-lg border bg-white text-zinc-900 shadow">
      <LexicalComposer initialConfig={configRef.current}>
        <TooltipProvider>
          <Plugins />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState)
              onSerializedChange?.(editorState.toJSON())
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
