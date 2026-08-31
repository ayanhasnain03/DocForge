import { Node, mergeAttributes } from '@tiptap/core';
import type { JSONContent, MarkdownRendererHelpers } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { serializeMdxBlock } from '@/lib/admin/mdx-document';
import { MdxBlockView } from '@/components/admin/notion-editor/mdx-block-view';

export const MdxBlock = Node.create({
  name: 'mdxBlock',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      blockType: { default: 'callout' },
      blockData: { default: '{}' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-mdx-block': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxBlockView);
  },

  renderMarkdown(node: JSONContent, _helpers: MarkdownRendererHelpers) {
    const attrs = node.attrs ?? {};
    return serializeMdxBlock({
      blockType: String(attrs.blockType ?? 'markdown'),
      blockData: String(attrs.blockData ?? '{}'),
    });
  },
});
