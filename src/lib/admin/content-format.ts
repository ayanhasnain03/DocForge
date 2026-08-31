import matter from 'gray-matter';
import type { DocFile, DocFrontmatter, MetaFile } from '@/lib/admin/content-types';

export function normalizeRelativePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.includes('..')) {
    throw new Error('Invalid path');
  }
  return normalized;
}

export function serializeDoc(frontmatter: DocFrontmatter, body: string): string {
  const fm: Record<string, string> = { title: frontmatter.title };
  if (frontmatter.description) {
    fm.description = frontmatter.description;
  }
  return matter.stringify(`\n${body.trim()}\n`, fm);
}

export function serializeMeta(data: Record<string, unknown>): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function parseDoc(relativePath: string, raw: string): DocFile {
  const { data, content } = matter(raw);
  return {
    path: normalizeRelativePath(relativePath),
    frontmatter: {
      title: String(data.title ?? ''),
      description: data.description ? String(data.description) : undefined,
    },
    body: content.trimStart(),
  };
}

export function parseMeta(relativePath: string, raw: string): MetaFile {
  return {
    path: normalizeRelativePath(relativePath),
    data: JSON.parse(raw) as Record<string, unknown>,
  };
}
