import type { ContentBlock } from '@/lib/admin/blocks';
import { createBlock, serializeBlock } from '@/lib/admin/blocks';
import { mdxSegmentToBlockWithFallback } from '@/lib/admin/mdx-parse';

export type MdxSegment =
  | { kind: 'markdown'; content: string }
  | { kind: 'mdx'; mdx: string; block?: ContentBlock };

const MDX_PATTERNS: RegExp[] = [
  /<Callout[\s\S]*?<\/Callout>/g,
  /<Tabs[\s\S]*?<\/Tabs>/g,
  /<Accordions[\s\S]*?<\/Accordions>/g,
  /<Cards[\s\S]*?<\/Cards>/g,
  /<Steps[\s\S]*?<\/Steps>/g,
  /<Files[\s\S]*?<\/Files>/g,
  /<GithubInfo[^>]*\/>/g,
];

type Match = { index: number; length: number; mdx: string };

function findNextMdxMatch(body: string, from: number): Match | null {
  let best: Match | null = null;

  for (const pattern of MDX_PATTERNS) {
    pattern.lastIndex = from;
    const match = pattern.exec(body);
    if (!match) continue;
    if (!best || match.index < best.index) {
      best = { index: match.index, length: match[0].length, mdx: match[0] };
    }
  }

  return best;
}

export function splitMdxBody(body: string): MdxSegment[] {
  const trimmed = body.trim();
  if (!trimmed) return [{ kind: 'markdown', content: '' }];

  const segments: MdxSegment[] = [];
  let cursor = 0;

  while (cursor < trimmed.length) {
    const match = findNextMdxMatch(trimmed, cursor);
    if (!match) {
      const tail = trimmed.slice(cursor).trim();
      if (tail) segments.push({ kind: 'markdown', content: tail });
      break;
    }

    const before = trimmed.slice(cursor, match.index).trim();
    if (before) segments.push({ kind: 'markdown', content: before });

    segments.push({ kind: 'mdx', mdx: match.mdx.trim() });
    cursor = match.index + match.length;
  }

  return segments.length > 0 ? segments : [{ kind: 'markdown', content: '' }];
}

export type EditorNodeAttrs = {
  blockType: string;
  blockData: string;
};

export function mdxSegmentToBlock(segment: Extract<MdxSegment, { kind: 'mdx' }>): ContentBlock {
  if (segment.block) return segment.block;
  return mdxSegmentToBlockWithFallback(segment.mdx);
}

export function blockToAttrs(block: ContentBlock): EditorNodeAttrs {
  const { id: _id, type, ...rest } = block as ContentBlock & Record<string, unknown>;
  return {
    blockType: type,
    blockData: JSON.stringify({ id: block.id, ...rest }),
  };
}

export function attrsToBlock(attrs: EditorNodeAttrs): ContentBlock {
  const data = JSON.parse(attrs.blockData) as Record<string, unknown>;
  return { ...data, type: attrs.blockType, id: String(data.id ?? crypto.randomUUID()) } as ContentBlock;
}

export function serializeMdxBlock(attrs: EditorNodeAttrs): string {
  const block = attrsToBlock(attrs);
  if (block.type === 'markdown') {
    return block.content;
  }
  return serializeBlock(block);
}

export function createMdxBlockAttrs(type: ContentBlock['type']): EditorNodeAttrs {
  return blockToAttrs(createBlock(type));
}
