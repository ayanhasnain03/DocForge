import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'docs');

export type ContentNode =
  | { type: 'file'; name: string; path: string }
  | { type: 'folder'; name: string; path: string; children: ContentNode[] };

export type DocFrontmatter = {
  title: string;
  description?: string;
};

export type DocFile = {
  path: string;
  frontmatter: DocFrontmatter;
  body: string;
};

export type MetaFile = {
  path: string;
  data: Record<string, unknown>;
};

function resolveSafePath(relativePath: string): string {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
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
  const { data, content } = matter(raw);

  return {
    path: relativePath.replace(/\\/g, '/'),
    frontmatter: {
      title: String(data.title ?? ''),
      description: data.description ? String(data.description) : undefined,
    },
    body: content.trimStart(),
  };
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

  const fm: Record<string, string> = { title: frontmatter.title };
  if (frontmatter.description) {
    fm.description = frontmatter.description;
  }

  const file = matter.stringify(`\n${body.trim()}\n`, fm);
  await fs.writeFile(full, file, 'utf8');
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
  return {
    path: relativePath.replace(/\\/g, '/'),
    data: JSON.parse(raw) as Record<string, unknown>,
  };
}

export async function writeMeta(
  relativePath: string,
  data: Record<string, unknown>,
): Promise<void> {
  const full = resolveSafePath(relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  );
}
