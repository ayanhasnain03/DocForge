import type { Editor } from '@tiptap/core';
import type { ContentBlock } from '@/lib/admin/blocks';
import { createMdxBlockAttrs } from '@/lib/admin/mdx-document';

export type InsertItem = {
  id: string;
  label: string;
  description: string;
  group: 'basic' | 'list' | 'media' | 'component';
  icon: string;
  action: (editor: Editor) => void;
};

export function insertMdxBlock(editor: Editor, type: ContentBlock['type']) {
  const attrs = createMdxBlockAttrs(type);
  editor
    .chain()
    .focus()
    .insertContent([
      { type: 'mdxBlock', attrs },
      { type: 'paragraph' },
    ])
    .run();
}

export const INSERT_ITEMS: InsertItem[] = [
  {
    id: 'text',
    label: 'Text',
    description: 'Plain paragraph',
    group: 'basic',
    icon: 'T',
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Page title',
    group: 'basic',
    icon: 'H1',
    action: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Section title',
    group: 'basic',
    icon: 'H2',
    action: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Subsection',
    group: 'basic',
    icon: 'H3',
    action: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    id: 'h4',
    label: 'Heading 4',
    description: 'Small heading',
    group: 'basic',
    icon: 'H4',
    action: (editor) => editor.chain().focus().setHeading({ level: 4 }).run(),
  },
  {
    id: 'bullet',
    label: 'Bullet list',
    description: 'Unordered list',
    group: 'list',
    icon: '•',
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'ordered',
    label: 'Numbered list',
    description: 'Ordered list',
    group: 'list',
    icon: '1.',
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Blockquote',
    group: 'basic',
    icon: '"',
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'code',
    label: 'Code',
    description: 'Code block',
    group: 'media',
    icon: '{ }',
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'hr',
    label: 'Divider',
    description: 'Horizontal line',
    group: 'basic',
    icon: '—',
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  ...(
    [
      ['callout', 'Callout', 'Tip or warning box', '!'],
      ['tabs', 'Tabs', 'Tabbed content', '⇥'],
      ['accordions', 'Accordion', 'Collapsible FAQ', '▼'],
      ['cards', 'Cards', 'Link card grid', '▦'],
      ['steps', 'Steps', 'Numbered steps', '①'],
      ['files', 'File tree', 'Folder structure', 'F'],
      ['github', 'GitHub', 'Repo info', 'GH'],
    ] as const
  ).map(([type, label, description, icon]) => ({
    id: type,
    label,
    description,
    group: 'component' as const,
    icon,
    action: (editor: Editor) => insertMdxBlock(editor, type),
  })),
];

export function filterInsertItems(query: string): InsertItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return INSERT_ITEMS;
  return INSERT_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.id.includes(q),
  );
}

export function removeSlashQuery(editor: Editor): void {
  const { from } = editor.state.selection;
  const textBefore = editor.state.doc.textBetween(Math.max(0, from - 60), from, '\n', '\0');
  const slash = textBefore.lastIndexOf('/');
  if (slash < 0) return;

  const segment = textBefore.slice(slash + 1);
  if (segment.includes(' ') || segment.includes('\n')) return;

  const deleteFrom = from - (textBefore.length - slash);
  editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
}

export function runInsertAction(editor: Editor, item: InsertItem, fromSlash = false): void {
  if (fromSlash) removeSlashQuery(editor);
  item.action(editor);
}
