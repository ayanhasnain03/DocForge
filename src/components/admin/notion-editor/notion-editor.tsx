'use client';

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Markdown } from '@tiptap/markdown';
import type { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { FloatingMenu } from '@tiptap/react/menus';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect, useRef, useState } from 'react';
import StarterKit from '@tiptap/starter-kit';
import { deferAfterPaint, deferTask } from '@/lib/admin/defer';
import {
  blockToAttrs,
  mdxSegmentToBlock,
  splitMdxBody,
} from '@/lib/admin/mdx-document';
import { EditorToolbar, SelectionBubbleMenu } from '@/components/admin/notion-editor/format-toolbar';
import { InsertPalette } from '@/components/admin/notion-editor/insert-palette';
import { INSERT_ITEMS, runInsertAction } from '@/components/admin/notion-editor/insert-actions';
import { MdxBlock } from '@/components/admin/notion-editor/mdx-block-extension';
import { SlashMenu } from '@/components/admin/notion-editor/slash-menu';

const lowlight = createLowlight(common);

type NotionEditorProps = {
  initialContent: string;
  onChange: (markdown: string) => void;
};

function buildDocumentJson(body: string, parseMarkdown: (md: string) => JSONContent | null): JSONContent {
  const segments = splitMdxBody(body);
  const nodes: JSONContent[] = [];

  for (const segment of segments) {
    if (segment.kind === 'mdx') {
      const block = mdxSegmentToBlock(segment);
      nodes.push({
        type: 'mdxBlock',
        attrs: blockToAttrs(block),
      });
      continue;
    }

    if (!segment.content.trim()) continue;

    const parsed = parseMarkdown(segment.content);
    if (parsed?.content?.length) {
      nodes.push(...parsed.content);
    } else {
      nodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: segment.content }],
      });
    }
  }

  if (nodes.length === 0) {
    nodes.push({ type: 'paragraph' });
  }

  return { type: 'doc', content: nodes };
}

export function NotionEditor({ initialContent, onChange }: NotionEditorProps) {
  const onChangeRef = useRef(onChange);
  const loadedRef = useRef(false);
  const initialRef = useRef(initialContent);

  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });

  onChangeRef.current = onChange;
  initialRef.current = initialContent;

  const detectSlash = useCallback((current: Editor) => {
    if (!current) return;

    const { from } = current.state.selection;
    const textBefore = current.state.doc.textBetween(Math.max(0, from - 60), from, '\n', '\0');
    const slash = textBefore.lastIndexOf('/');
    const segment = slash >= 0 ? textBefore.slice(slash + 1) : '';

    if (slash < 0 || segment.includes(' ') || segment.includes('\n')) {
      setSlashOpen(false);
      setSlashQuery('');
      return;
    }

    const coords = current.view.coordsAtPos(from);
    const editorRect = current.view.dom.getBoundingClientRect();
    setSlashPos({
      top: coords.bottom - editorRect.top + 8,
      left: coords.left - editorRect.left,
    });
    setSlashQuery(segment);
    setSlashOpen(true);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
        link: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'notion-link' },
      }),
      HorizontalRule,
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Heading';
          return "Type '/' for blocks or use Insert below";
        },
      }),
      Markdown,
      MdxBlock,
    ],
    editorProps: {
      attributes: {
        class: 'notion-editor-content',
      },
      handleKeyDown: (view, event) => {
        if (event.key !== 'Tab') return false;

        const { state } = view;
        const { $from } = state.selection;
        const inCode =
          $from.parent.type.name === 'codeBlock' ||
          ($from.parent.isTextblock && $from.parent.type.spec.code);

        if (inCode) {
          event.preventDefault();
          view.dispatch(state.tr.insertText('  '));
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor: current }) => {
      deferTask(() => {
        onChangeRef.current(current.getMarkdown());
      });
      deferAfterPaint(() => detectSlash(current));
    },
    onSelectionUpdate: ({ editor: current }) => {
      deferAfterPaint(() => detectSlash(current));
    },
  });

  // Load document once per mount — never re-sync from parent onChange (fixes cursor jump).
  useEffect(() => {
    if (!editor || loadedRef.current) return;
    loadedRef.current = true;

    deferTask(() => {
      if (editor.isDestroyed) return;

      const parseMarkdown = (md: string) => {
        try {
          return editor.markdown?.parse(md) ?? null;
        } catch {
          return null;
        }
      };

      const doc = buildDocumentJson(initialRef.current, parseMarkdown);
      editor.commands.setContent(doc, { emitUpdate: false });
    });
  }, [editor]);

  if (!editor) {
    return <div className="admin-empty">Loading editor…</div>;
  }

  return (
    <div className="notion-editor">
      <EditorToolbar editor={editor} />
      <InsertPalette editor={editor} />
      <div className="notion-editor-surface">
        <FloatingMenu
          editor={editor}
          className="notion-floating-menu"
          shouldShow={({ state }) => {
            const { $from } = state.selection;
            const isEmptyTextblock =
              $from.parent.isTextblock && $from.parent.content.size === 0;
            return isEmptyTextblock && $from.parent.type.name !== 'codeBlock';
          }}
        >
          <button
            type="button"
            className="notion-floating-btn"
            title="Add block"
            onClick={() => {
              const textItem = INSERT_ITEMS[0];
              if (textItem) runInsertAction(editor, textItem);
            }}
          >
            +
          </button>
        </FloatingMenu>
        <EditorContent editor={editor} />
        <SelectionBubbleMenu editor={editor} />
        <SlashMenu
          editor={editor}
          open={slashOpen}
          query={slashQuery}
          position={slashPos}
          onClose={() => {
            setSlashOpen(false);
            setSlashQuery('');
          }}
        />
      </div>
      <p className="admin-muted notion-editor-hint">
        Type <kbd>/</kbd> anywhere · Use <strong>Insert block</strong> · Select text to format
      </p>
    </div>
  );
}
