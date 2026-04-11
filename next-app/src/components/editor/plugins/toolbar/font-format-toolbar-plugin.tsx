import { useCallback, useRef, useState } from "react"
import { $isTableSelection } from "@lexical/table"
import {
  $isRangeSelection,
  BaseSelection,
  FORMAT_TEXT_COMMAND,
  TextFormatType,
} from "lexical"
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const FORMATS = [
  { format: "bold", icon: BoldIcon, label: "Bold" },
  { format: "italic", icon: ItalicIcon, label: "Italic" },
  { format: "underline", icon: UnderlineIcon, label: "Underline" },
  { format: "strikethrough", icon: StrikethroughIcon, label: "Strikethrough" },
] as const

export function FontFormatToolbarPlugin() {
  const { activeEditor } = useToolbarContext()
  const [activeFormats, setActiveFormats] = useState<string[]>([])
  const activeFormatsRef = useRef<string[]>([])
  activeFormatsRef.current = activeFormats

  const $updateToolbar = useCallback((selection: BaseSelection) => {
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      const formats: string[] = []
      FORMATS.forEach(({ format }) => {
        if (selection.hasFormat(format as TextFormatType)) {
          formats.push(format)
        }
      })
      setActiveFormats((prev) => {
        // Only update if formats have changed
        if (
          prev.length !== formats.length ||
          !formats.every((f) => prev.includes(f))
        ) {
          return formats
        }
        return prev
      })
    }
  }, [])

  useUpdateToolbarHandler($updateToolbar)

  const handleFormatValueChange = useCallback(
    (next: string[]) => {
      const prev = activeFormatsRef.current
      const turnedOn = next.find((f) => !prev.includes(f))
      const turnedOff = prev.find((f) => !next.includes(f))
      const format = (turnedOn ?? turnedOff) as TextFormatType | undefined
      if (format) {
        activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
      }
    },
    [activeEditor]
  )

  return (
    <ToggleGroup
      type="multiple"
      value={activeFormats}
      onValueChange={handleFormatValueChange}
      variant="outline"
      size="sm"
    >
      {FORMATS.map(({ format, icon: Icon, label }) => (
        <ToggleGroupItem key={format} value={format} aria-label={label}>
          <Icon className="size-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
