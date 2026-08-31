import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  ContentNode,
  DocFile,
  DocFrontmatter,
  MetaFile,
} from '@/lib/admin/content-types';
import {
  normalizeRelativePath,
  parseDoc,
  parseMeta,
  serializeDoc,
  serializeMeta,
} from '@/lib/admin/content-format';

export type {
  ContentNode,
  DocFile,
  DocFrontmatter,
  MetaFile,
} from '@/lib/admin/content-types';
export { slugifyTitle } from '@/lib/admin/content-types';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'docs');

function resolveSafePath(relativePath: string): string {
  const normalized = normalizeRelativePath(relativePath);
  const full = path.join(CONTENT_ROOT, normalized);
  if (!full.startsWith(CONTENT_ROOT)) {
    throw new Error('Invalid path');
  }
  return full;
}

export async function listContentTree(): Promise<ContentNode[]> {
  async function walk(dir: string, rel = ''): Promise<ContentNode[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nodes: ContentNode[] = [];

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const children = await walk(path.join(dir, entry.name), entryRel);
        nodes.push({ type: 'folder', name: entry.name, path: entryRel, children });
        continue;
      }

      if (entry.name.endsWith('.mdx') || entry.name === 'meta.json') {
        nodes.push({ type: 'file', name: entry.name, path: entryRel });
      }
    }

    return nodes;
  }

  return walk(CONTENT_ROOT);
}

export async function readDoc(relativePath: string): Promise<DocFile> {
  if (!relativePath.endsWith('.mdx')) {
    throw new Error('Document path must end with .mdx');
  }
  const full = resolveSafePath(relativePath);
  const raw = await fs.readFile(full, 'utf8');
  return parseDoc(relativePath, raw);
}

export async function writeDoc(
  relativePath: string,
  frontmatter: DocFrontmatter,
  body: string,
): Promise<void> {
  if (!relativePath.endsWith('.mdx')) {
    throw new Error('Document path must end with .mdx');
  }
  const full = resolveSafePath(relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, serializeDoc(frontmatter, body), 'utf8');
}

export async function deleteDoc(relativePath: string): Promise<void> {
  const full = resolveSafePath(relativePath);
  await fs.unlink(full);
}

export async function readMeta(relativePath: string): Promise<MetaFile> {
  if (!relativePath.endsWith('meta.json')) {
    throw new Error('Meta path must end with meta.json');
  }
  const full = resolveSafePath(relativePath);
  const raw = await fs.readFile(full, 'utf8');
  return parseMeta(relativePath, raw);
}

export async function writeMeta(
  relativePath: string,
  data: Record<string, unknown>,
): Promise<void> {
  const full = resolveSafePath(relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, serializeMeta(data), 'utf8');
}
