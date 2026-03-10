"use client";

import { useMemo, useState } from "react";
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
  const [initialSerialized] = useState(() => serializedState);
  const initialConfig = useMemo<InitialConfigType>(() => {
    return {
      namespace: "LexicalViewer",
      theme: editorTheme,
      nodes,
      editable: false,
      editorState: JSON.stringify(initialSerialized),
      onError: (error: Error) => {
        console.error(error);
      },
    };
  }, [initialSerialized]);

  return (
    <div
      className={className}
      style={{ minHeight: "1.5em" }}
    >
      <LexicalComposer initialConfig={initialConfig}>
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
