"use client"

import { useMemo, useState } from "react"
import { LexicalCollaboration } from "@lexical/react/LexicalCollaborationContext"
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
  const [initialEditorState] = useState(() => editorState)
  const [initialSerialized] = useState(() => editorSerializedState)
  const initialConfig = useMemo(() => {
    const baseConfig: InitialConfigType = {
      ...editorConfig,
      ...(initialEditorState ? { editorState: initialEditorState } : {}),
    }
    return initialSerialized
      ? { ...baseConfig, editorState: JSON.stringify(initialSerialized) }
      : baseConfig
  }, [initialEditorState, initialSerialized])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white text-zinc-900 isolate">
      <LexicalComposer initialConfig={initialConfig}>
        <LexicalCollaboration>
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
        </LexicalCollaboration>
      </LexicalComposer>
    </div>
  )
}
