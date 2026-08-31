export type TreeFileKind = 'page' | 'index' | 'meta';

export type TreeTarget =
  | { kind: 'folder'; path: string; name: string }
  | { kind: 'file'; path: string; name: string; fileKind: TreeFileKind };

export function treeTargetLabel(target: TreeTarget): string {
  if (target.kind === 'folder') return target.name;
  if (target.fileKind === 'meta') return 'Navigation';
  if (target.fileKind === 'index') return 'Index';
  return target.name.replace(/\.mdx$/, '');
}

export function canRenameTarget(target: TreeTarget): boolean {
  return target.kind === 'folder' || target.fileKind !== 'meta';
}

export function deleteTargetDescription(target: TreeTarget): string {
  if (target.kind === 'folder') {
    return `Delete the folder "${target.name}" and everything inside it. This cannot be undone.`;
  }

  if (target.fileKind === 'meta') {
    return `Delete navigation for this section. Pages in the folder will remain on disk but may disappear from the sidebar.`;
  }

  return `Delete "${treeTargetLabel(target)}" permanently. This cannot be undone.`;
}
