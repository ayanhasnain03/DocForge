'use client';

import type { ContentNode } from '@/lib/admin/content';

type ContentTreeProps = {
  nodes: ContentNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onCreateInFolder?: (folderPath: string) => void;
  onCreateFolderIn?: (folderPath: string) => void;
  depth?: number;
};

export function ContentTree({
  nodes,
  selectedPath,
  onSelect,
  onCreateInFolder,
  onCreateFolderIn,
  depth = 0,
}: ContentTreeProps) {
  return (
    <ul className="admin-tree" data-depth={depth}>
      {nodes.map((node) => {
        if (node.type === 'folder') {
          return (
            <li key={node.path} className="admin-tree-folder">
              <div className="admin-tree-row">
                <button
                  type="button"
                  className="admin-tree-folder-btn"
                  onClick={() => {
                    const indexPath = `${node.path}/index.mdx`;
                    onSelect(indexPath);
                  }}
                >
                  {node.name}
                </button>
                <div className="admin-tree-folder-actions">
                  {onCreateFolderIn ? (
                    <button
                      type="button"
                      className="admin-icon-btn"
                      title={`New subfolder in ${node.name}`}
                      onClick={() => onCreateFolderIn(node.path)}
                    >
                      ⊞
                    </button>
                  ) : null}
                  {onCreateInFolder ? (
                    <button
                      type="button"
                      className="admin-icon-btn"
                      title={`New page in ${node.name}`}
                      onClick={() => onCreateInFolder(node.path)}
                    >
                      +
                    </button>
                  ) : null}
                </div>
              </div>
              <ContentTree
                nodes={node.children}
                selectedPath={selectedPath}
                onSelect={onSelect}
                onCreateInFolder={onCreateInFolder}
                onCreateFolderIn={onCreateFolderIn}
                depth={depth + 1}
              />
            </li>
          );
        }

        const label = node.name === 'meta.json' ? 'Navigation' : node.name.replace(/\.mdx$/, '');

        return (
          <li key={node.path}>
            <button
              type="button"
              className="admin-tree-file"
              data-active={selectedPath === node.path}
              onClick={() => onSelect(node.path)}
            >
              {label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
