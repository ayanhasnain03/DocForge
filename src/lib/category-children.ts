import type { ReactNode } from 'react';
import { visit, type Folder, type Root, type Node } from 'fumadocs-core/page-tree';

export type CategoryChildLink = {
  name: ReactNode;
  description?: ReactNode;
  url: string;
};

export function getCategoryChildLinks(
  tree: Root,
  url: string,
): CategoryChildLink[] {
  let children: CategoryChildLink[] = [];

  visit(tree, (node) => {
    if (node.type === 'folder' && node.index?.url === url) {
      children = collectChildLinks(node.children);
      return 'break';
    }
  });

  return children;
}

export function isolateSectionTree(tree: Root, slug?: string[]): Root {
  const section = slug?.[0];
  if (!section) return tree;

  const prefix = `/${section}`;
  const folder = tree.children.find(
    (node): node is Folder =>
      node.type === 'folder' && sectionContains(node, prefix),
  );

  if (!folder) return tree;

  return {
    ...tree,
    children: folder.children.filter(
      (child) => !(child.type === 'page' && child.url === prefix),
    ),
  };
}

function sectionContains(folder: Folder, prefix: string): boolean {
  if (folder.index?.url === prefix || folder.index?.url?.startsWith(`${prefix}/`)) {
    return true;
  }

  return folder.children.some((child) => {
    if (child.type === 'page') return child.url === prefix || child.url.startsWith(`${prefix}/`);
    if (child.type === 'folder') return sectionContains(child, prefix);
    return false;
  });
}

function collectChildLinks(nodes: Node[]): CategoryChildLink[] {
  const links: CategoryChildLink[] = [];

  for (const child of nodes) {
    if (child.type === 'page') {
      links.push({
        name: child.name,
        description: child.description,
        url: child.url,
      });
      continue;
    }

    if (child.type === 'folder' && child.index) {
      links.push({
        name: child.name,
        description: child.description,
        url: child.index.url,
      });
    }
  }

  return links;
}
