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

export type ContentSource = 'github' | 'fs';

export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  );
}
