import { ImageIcon } from "lucide-react"

import { useToolbarContext } from "@/components/editor/context/toolbar-context"
import { InsertImageDialog } from "@/components/editor/plugins/images-plugin"
import { SelectItem } from "@/components/ui/select"

export function InsertImage() {
  const { activeEditor, showModal } = useToolbarContext()

  const openImageModal = () => {
    showModal("Insert Image", (onClose) => (
      <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />
    ))
  }

  return (
    <SelectItem
      value="image"
      onPointerDown={(e) => {
        e.preventDefault()
        openImageModal()
      }}
    >
      <div className="flex items-center gap-1">
        <ImageIcon className="size-4" />
        <span>Image</span>
      </div>
    </SelectItem>
  )
}
