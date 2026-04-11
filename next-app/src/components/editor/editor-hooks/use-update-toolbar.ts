import { useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { mergeRegister } from "@lexical/utils"
import {
  $getSelection,
  BaseSelection,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
} from "lexical"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"

export function useUpdateToolbarHandler(
  callback: (selection: BaseSelection) => void
) {
  const [editor] = useLexicalComposerContext()
  const { activeEditor } = useToolbarContext()

  useEffect(() => {
    return mergeRegister(
      activeEditor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const selection = $getSelection()
          if (selection) {
            callback(selection)
          }
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection()
          if (selection) {
            callback(selection)
          }
        })
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, activeEditor, callback])

  useEffect(() => {
    activeEditor.getEditorState().read(() => {
      const selection = $getSelection()
      if (selection) {
        callback(selection)
      }
    })
  }, [activeEditor, callback])
}
