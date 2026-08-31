import { gitConfig } from '@/lib/shared';

export type FileTreeItem =
  | { kind: 'file'; name: string }
  | { kind: 'folder'; name: string; defaultOpen?: boolean; children: FileTreeItem[] };

export type ContentBlock =
  | { id: string; type: 'markdown'; content: string }
  | { id: string; type: 'heading'; level: 2 | 3 | 4; text: string }
  | { id: string; type: 'code'; language: string; code: string }
  | {
      id: string;
      type: 'callout';
      calloutType: 'info' | 'warning' | 'error' | 'success' | 'idea';
      title?: string;
      content: string;
    }
  | { id: string; type: 'tabs'; items: { label: string; content: string }[] }
  | {
      id: string;
      type: 'accordions';
      accordionType?: 'single' | 'multiple';
      items: { title: string; content: string }[];
    }
  | {
      id: string;
      type: 'cards';
      items: { title: string; description?: string; href?: string }[];
    }
  | { id: string; type: 'steps'; items: string[] }
  | { id: string; type: 'files'; items: FileTreeItem[] }
  | { id: string; type: 'github'; owner: string; repo: string };

export const BLOCK_LABELS: Record<ContentBlock['type'], string> = {
  markdown: 'Markdown',
  heading: 'Heading',
  code: 'Code block',
  callout: 'Callout',
  tabs: 'Tabs',
  accordions: 'Accordions',
  cards: 'Cards',
  steps: 'Steps',
  files: 'File tree',
  github: 'GitHub info',
};

export function createBlock(type: ContentBlock['type']): ContentBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case 'markdown':
      return { id, type, content: '' };
    case 'heading':
      return { id, type, level: 2, text: 'Section title' };
    case 'code':
      return { id, type, language: 'bash', code: '' };
    case 'callout':
      return { id, type, calloutType: 'info', title: 'Note', content: '' };
    case 'tabs':
      return {
        id,
        type,
        items: [
          { label: 'npm', content: '```bash\nnpm install\n```' },
          { label: 'pnpm', content: '```bash\npnpm add\n```' },
        ],
      };
    case 'accordions':
      return {
        id,
        type,
        accordionType: 'single',
        items: [{ title: 'Question', content: 'Answer goes here.' }],
      };
    case 'cards':
      return {
        id,
        type,
        items: [{ title: 'Card title', description: 'Short description.', href: '/' }],
      };
    case 'steps':
      return { id, type, items: ['First step', 'Second step'] };
    case 'files':
      return {
        id,
        type,
        items: [
          {
            kind: 'folder',
            name: 'src',
            defaultOpen: true,
            children: [{ kind: 'file', name: 'index.ts' }],
          },
          { kind: 'file', name: 'package.json' },
        ],
      };
    case 'github':
      return { id, type, owner: gitConfig.user, repo: gitConfig.repo };
  }
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, '&quot;');
}

function serializeFileTree(items: FileTreeItem[], indent: string): string {
  return items
    .map((item) => {
      if (item.kind === 'file') {
        return `${indent}<File name="${escapeAttr(item.name)}" />`;
      }
      const open = item.defaultOpen ? ' defaultOpen={true}' : '';
      const children = serializeFileTree(item.children, `${indent}  `);
      return `${indent}<Folder name="${escapeAttr(item.name)}"${open}>\n${children}\n${indent}</Folder>`;
    })
    .join('\n');
}

export function serializeBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'markdown':
      return block.content.trim();
    case 'heading': {
      const hashes = '#'.repeat(block.level);
      return `${hashes} ${block.text}`;
    }
    case 'code':
      return `\`\`\`${block.language}\n${block.code}\n\`\`\``;
    case 'callout': {
      const title = block.title ? ` title="${escapeAttr(block.title)}"` : '';
      return `<Callout type="${block.calloutType}"${title}>\n  ${block.content.trim()}\n</Callout>`;
    }
    case 'tabs': {
      const labels = block.items.map((t) => t.label);
      const tabs = block.items
        .map(
          (tab) =>
            `  <Tab value="${escapeAttr(tab.label)}">\n${tab.content
              .split('\n')
              .map((line) => `    ${line}`)
              .join('\n')}\n  </Tab>`,
        )
        .join('\n');
      return `<Tabs items={${JSON.stringify(labels)}}>\n${tabs}\n</Tabs>`;
    }
    case 'accordions': {
      const typeAttr = block.accordionType ? ` type="${block.accordionType}"` : '';
      const items = block.items
        .map(
          (item) =>
            `  <Accordion title="${escapeAttr(item.title)}">\n    ${item.content.trim()}\n  </Accordion>`,
        )
        .join('\n');
      return `<Accordions${typeAttr}>\n${items}\n</Accordions>`;
    }
    case 'cards': {
      const cards = block.items
        .map((card) => {
          const attrs = [
            `title="${escapeAttr(card.title)}"`,
            card.description ? `description="${escapeAttr(card.description)}"` : null,
            card.href ? `href="${escapeAttr(card.href)}"` : null,
          ]
            .filter(Boolean)
            .join(' ');
          return `  <Card ${attrs} />`;
        })
        .join('\n');
      return `<Cards>\n${cards}\n</Cards>`;
    }
    case 'steps': {
      const steps = block.items
        .map((step) => `  <Step>\n    ${step.trim()}\n  </Step>`)
        .join('\n');
      return `<Steps>\n${steps}\n</Steps>`;
    }
    case 'files': {
      const tree = serializeFileTree(block.items, '  ');
      return `<Files>\n${tree}\n</Files>`;
    }
    case 'github':
      return `<GithubInfo owner="${escapeAttr(block.owner)}" repo="${escapeAttr(block.repo)}" />`;
  }
}

export function serializeBlocks(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => serializeBlock(block))
    .filter(Boolean)
    .join('\n\n');
}

export function parseBodyToBlocks(body: string): ContentBlock[] {
  const trimmed = body.trim();
  if (!trimmed) {
    return [createBlock('markdown')];
  }
  return [{ id: crypto.randomUUID(), type: 'markdown', content: trimmed }];
}
