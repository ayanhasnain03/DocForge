import type { ContentSource } from '@/lib/admin/content-types';

export type {
  ContentNode,
  ContentSource,
  DocFile,
  DocFrontmatter,
  MetaFile,
} from '@/lib/admin/content-types';
export { slugifyTitle } from '@/lib/admin/content-types';

import * as fsContent from '@/lib/admin/content';
import * as githubContent from '@/lib/admin/github-content';

function resolveContentSource(): ContentSource {
  const backend = process.env.CONTENT_BACKEND?.toLowerCase();
  if (backend === 'github') return 'github';
  if (backend === 'fs') return 'fs';
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) return 'github';
  return 'fs';
}

const source = resolveContentSource();
const store = source === 'github' ? githubContent : fsContent;

export function getContentSource(): ContentSource {
  return source;
}

export const listContentTree = store.listContentTree;
export const readDoc = store.readDoc;
export const writeDoc = store.writeDoc;
export const deleteDoc = store.deleteDoc;
export const readMeta = store.readMeta;
export const writeMeta = store.writeMeta;
