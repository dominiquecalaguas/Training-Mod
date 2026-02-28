"use client";

import { useRef } from "react";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import type { SerializedEditorState } from "lexical";

import { ContentEditable } from "@/components/editor/editor-ui/content-editable";
import { editorTheme } from "@/components/editor/themes/editor-theme";

import { nodes } from "./nodes";

export function LexicalViewer({
  serializedState,
  className,
}: {
  serializedState: SerializedEditorState;
  className?: string;
}) {
  const configRef = useRef<InitialConfigType | null>(null);
  if (configRef.current === null) {
    configRef.current = {
      namespace: "LexicalViewer",
      theme: editorTheme,
      nodes,
      editable: false,
      editorState: JSON.stringify(serializedState),
      onError: (error: Error) => {
        console.error(error);
      },
    };
  }

  return (
    <div
      className={className}
      style={{ minHeight: "1.5em" }}
    >
      <LexicalComposer initialConfig={configRef.current}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              placeholder=""
              className="ContentEditable__root relative block min-h-4 overflow-auto bg-transparent px-0 py-0 text-inherit focus:outline-none"
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </LexicalComposer>
    </div>
  );
}
