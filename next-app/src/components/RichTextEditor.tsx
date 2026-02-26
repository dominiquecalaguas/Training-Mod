import { useEffect, useState } from 'react';

import { EditorContent } from '@tiptap/react';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import RichTextEditorMenu from './RichTextEditorMenu';
import RichTextEditorPlaceholder from './RichTextEditorPlaceholder';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import clsx from 'clsx';
import { useMarkdownEditor } from './useMarkdownEditor';
import {
  ALL_FORMATTING_OPTIONS,
  type Formatting,
  type PartialFormattingOptions,
} from './types';

const getConfigOptions = (allowedFormatting: Formatting[]) => {
  const options: PartialFormattingOptions = {};

  const removedAllAllowedFormatting = [...ALL_FORMATTING_OPTIONS].filter(
    (option: Formatting) => {
      return !allowedFormatting.includes(option);
    },
  );

  removedAllAllowedFormatting.forEach((option: Formatting) => {
    options[option] = false;
  });

  return options;
};

type Props = {
  isReadOnly?: boolean;
  initialValue: string;
  placeholder?: string;
  onBlur?: (text: string) => void;
  onChange?: (text: string) => void;
  showBorder?: boolean;
  hasError?: boolean;
  size?: 'sm' | 'md';
  allowedFormatting?: Formatting[];
  flexibleHeight?: boolean;
};

// Tiptap doesn't have a concept of a controlled component, so you can
// only set the initial value of the editor, but you can't update it later.
// The parent component should reinitialize the editor when it needs to
// clear the content.
// This can be done by updating the "key" prop of the RichTextEditor component.
function RichTextEditor({
  isReadOnly = false,
  initialValue = '',
  placeholder = '',
  onBlur,
  onChange,
  showBorder = false,
  hasError = false,
  size = 'md',
  allowedFormatting = ALL_FORMATTING_OPTIONS,
  flexibleHeight = false,
}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialValueSet, setIsInitialValueSet] = useState<boolean>(false);
  const classes = clsx({
    'py-2 px-3 rounded-md': !isReadOnly,
    'min-h-[12rem]': size === 'md',
    'min-h-[6rem]': size === 'sm',
  });

  const containerClasses = clsx({
    'prose w-0 min-w-full max-w-none leading-6 bg-white': true,
    'rounded-md border border-light-intermediate': showBorder,
    'border-red-500': hasError,
    '[&_.ProseMirror]:!pl-2 [&_.ProseMirror]:!pt-2': true,
    'flex flex-col h-full': flexibleHeight,
    '[&_.ProseMirror]:h-full [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:overflow-y-auto':
      flexibleHeight,
  });

  const configOptions = getConfigOptions(allowedFormatting);

  const editor = useMarkdownEditor({
    extensions: [
      StarterKit.configure(configOptions),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: placeholder || 'Enter text here',
        emptyEditorClass:
          'cursor-text before:content-[attr(data-placeholder)] before:absolute before:top-2 before:left-2 before:text-mauve-11 before:opacity-50 before-pointer-events-none',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialValue,
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class: classes,
      },
    },
  });

  useEffect(() => {
    if (isInitialValueSet || initialValue.length === 0) {
      return;
    }

    editor?.commands?.setContent(initialValue, false);

    setIsInitialValueSet(true);
  }, [initialValue]);

  useEffect(() => {
    if (editor) {
      editor.on('update', ({ editor }: { editor: any }) => {
        if (onChange) {
          const markdown = editor.getMarkdown();
          onChange(markdown);
        }
      });

      editor.on('blur', ({ editor }: { editor: any }) => {
        if (onBlur) {
          const markdown = editor.getMarkdown();
          onBlur(markdown);
        }
      });

      if (isLoading) {
        setIsLoading(false);
      }
    }

    return () => {
      if (editor) {
        editor.off('update');
        editor.off('blur');
      }
    };
  }, [editor]);

  if (isLoading && !isReadOnly) {
    return <RichTextEditorPlaceholder showBorder={showBorder} />;
  }

  return (
    <div className={containerClasses}>
      <EditorContent
        editor={editor}
        className={flexibleHeight ? 'h-full min-h-0 flex-1' : undefined}
      />
      {!isReadOnly && editor && (
        <RichTextEditorMenu editor={editor} configOptions={configOptions} />
      )}
    </div>
  );
}

export default RichTextEditor;