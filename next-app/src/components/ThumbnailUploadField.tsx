"use client";

import { useEffect, useRef, useState } from "react";
import { CloudUpload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ThumbnailUploadFieldProps = {
  label?: string;
  currentImageUrl?: string | null;
};

export function ThumbnailUploadField({
  label = "Thumbnail",
  currentImageUrl = null,
}: ThumbnailUploadFieldProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const showPreview = selectedFile || currentImageUrl;
  const displayUrl = selectedFile ? previewUrl : currentImageUrl ?? null;
  const displayLabel = selectedFile ? selectedFile.name : "Current thumbnail";

  const handleFiles = (files: FileList | null) => {
    if (files?.length && files[0].type.startsWith("image/")) {
      const file = files[0];
      setSelectedFile(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/") && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) setIsDragging(false);
  };

  const clearImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="sm:col-span-2 space-y-2">
      <label className="text-xs font-medium text-zinc-700">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        name="thumbnail"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        aria-label={label}
      />
      {showPreview && displayUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <img
            src={displayUrl}
            alt=""
            className="size-16 shrink-0 rounded-md border border-zinc-200 object-cover"
          />
          <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">
            {displayLabel}
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
            "flex min-h-[185px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
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
  );
}
