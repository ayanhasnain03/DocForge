'use client';

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import type { ContentNode } from '@/lib/admin/content';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { TreeTarget } from '@/lib/admin/tree-target';
import { canRenameTarget } from '@/lib/admin/tree-target';

type ContentTreeProps = {
  nodes: ContentNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  onCreateInFolder?: (folderPath: string) => void;
  onCreateFolderIn?: (folderPath: string) => void;
  onRename?: (target: TreeTarget) => void;
  onDelete?: (target: TreeTarget) => void;
};

type FileKind = 'page' | 'index' | 'meta';

const EXPANDED_KEY = 'harc-admin-tree-expanded';

function loadExpanded(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(EXPANDED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function defaultExpanded(nodes: ContentNode[]): Set<string> {
  const stored = loadExpanded();
  if (stored.size > 0) return stored;
  return new Set(
    nodes.filter((node): node is Extract<ContentNode, { type: 'folder' }> => node.type === 'folder').map((node) => node.path),
  );
}

function saveExpanded(expanded: Set<string>) {
  try {
    sessionStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]));
  } catch {
    // ignore storage errors
  }
}

function getFileKind(name: string): FileKind {
  if (name === 'meta.json') return 'meta';
  if (name === 'index.mdx') return 'index';
  return 'page';
}

function fileLabel(name: string): string {
  if (name === 'meta.json') return 'Navigation';
  if (name === 'index.mdx') return 'Index';
  return name.replace(/\.mdx$/, '');
}

function sortNodes(nodes: ContentNode[]): ContentNode[] {
  return [...nodes]
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;

      if (a.type === 'file' && b.type === 'file') {
        const rank = (name: string) => {
          if (name === 'index.mdx') return 0;
          if (name === 'meta.json') return 2;
          return 1;
        };
        const diff = rank(a.name) - rank(b.name);
        if (diff !== 0) return diff;
      }

      return a.name.localeCompare(b.name);
    })
    .map((node) =>
      node.type === 'folder'
        ? { ...node, children: sortNodes(node.children) }
        : node,
    );
}

function ancestorPaths(path: string): string[] {
  const parts = path.split('/');
  const folders: string[] = [];
  for (let i = 0; i < parts.length - 1; i += 1) {
    folders.push(parts.slice(0, i + 1).join('/'));
  }
  return folders;
}

function filterTree(nodes: ContentNode[], query: string): ContentNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const result: ContentNode[] = [];

  for (const node of nodes) {
    if (node.type === 'file') {
      const label = fileLabel(node.name).toLowerCase();
      if (label.includes(q) || node.path.toLowerCase().includes(q)) {
        result.push(node);
      }
      continue;
    }

    const children = filterTree(node.children, query);
    if (node.name.toLowerCase().includes(q) || children.length > 0) {
      result.push({ ...node, children });
    }
  }

  return result;
}

function collectFolderPaths(nodes: ContentNode[]): string[] {
  return nodes.flatMap((node) =>
    node.type === 'folder'
      ? [node.path, ...collectFolderPaths(node.children)]
      : [],
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="admin-tree-chevron"
      data-open={open}
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg className="admin-tree-icon" viewBox="0 0 16 16" aria-hidden="true">
      {open ? (
        <path
          d="M2 4.5A1 1 0 0 1 3 3.5h3l1 1.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7z"
          fill="currentColor"
          opacity="0.9"
        />
      ) : (
        <path
          d="M2 4.5A1 1 0 0 1 3 3.5h3l1 1.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      )}
    </svg>
  );
}

function FileIcon({ kind }: { kind: FileKind }) {
  if (kind === 'meta') {
    return (
      <svg className="admin-tree-icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M8 2.5v1.2M8 12.3v1.2M2.5 8h1.2M12.3 8h1.2M4.4 4.4l.85.85M10.75 10.75l.85.85M4.4 11.6l.85-.85M10.75 5.25l.85-.85"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg className="admin-tree-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4.5 2.5h4.6l2.4 2.4v8.6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M9 2.5v2.8a.6.6 0 0 0 .6.6H12.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function TreeContextMenu({
  target,
  onRename,
  onDelete,
  children,
}: {
  target: TreeTarget;
  onRename?: (target: TreeTarget) => void;
  onDelete?: (target: TreeTarget) => void;
  children: ReactNode;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="admin-tree-context-trigger">{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem
            disabled={!canRenameTarget(target)}
            onClick={() => onRename?.(target)}
          >
            Rename
          </ContextMenuItem>
          <ContextMenuItem variant="destructive" onClick={() => onDelete?.(target)}>
            Delete
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

type TreeBranchProps = {
  nodes: ContentNode[];
  depth: number;
  selectedPath: string | null;
  expanded: Set<string>;
  onToggle: (folderPath: string) => void;
  onSelect: (path: string) => void;
  onCreateInFolder?: (folderPath: string) => void;
  onCreateFolderIn?: (folderPath: string) => void;
  onRename?: (target: TreeTarget) => void;
  onDelete?: (target: TreeTarget) => void;
  forceExpand?: boolean;
};

function TreeBranch({
  nodes,
  depth,
  selectedPath,
  expanded,
  onToggle,
  onSelect,
  onCreateInFolder,
  onCreateFolderIn,
  onRename,
  onDelete,
  forceExpand = false,
}: TreeBranchProps) {
  return (
    <ul className="admin-tree" data-depth={depth} role="group">
      {nodes.map((node) => {
        if (node.type === 'folder') {
          const isOpen = forceExpand || expanded.has(node.path);
          const indexPath = `${node.path}/index.mdx`;
          const hasIndex = node.children.some(
            (child) => child.type === 'file' && child.name === 'index.mdx',
          );
          const isActive =
            selectedPath === indexPath ||
            (selectedPath?.startsWith(`${node.path}/`) ?? false);

          return (
            <li key={node.path} className="admin-tree-node">
              <TreeContextMenu
                target={{ kind: 'folder', path: node.path, name: node.name }}
                onRename={onRename}
                onDelete={onDelete}
              >
                <div
                  className="admin-tree-row"
                  data-active={isActive}
                  style={{ paddingInlineStart: `${depth * 0.875 + 0.25}rem` }}
                >
                <button
                  type="button"
                  className="admin-tree-toggle"
                  aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
                  aria-expanded={isOpen}
                  onClick={() => onToggle(node.path)}
                >
                  <ChevronIcon open={isOpen} />
                </button>

                <button
                  type="button"
                  className="admin-tree-label"
                  onClick={() => {
                    if (hasIndex) {
                      onSelect(indexPath);
                      return;
                    }
                    onToggle(node.path);
                  }}
                >
                  <FolderIcon open={isOpen} />
                  <span className="admin-tree-name">{node.name}</span>
                </button>

                <div className="admin-tree-actions">
                  {onCreateFolderIn ? (
                    <button
                      type="button"
                      className="admin-tree-action"
                      title={`New folder in ${node.name}`}
                      onClick={() => onCreateFolderIn(node.path)}
                    >
                      ⊞
                    </button>
                  ) : null}
                  {onCreateInFolder ? (
                    <button
                      type="button"
                      className="admin-tree-action"
                      title={`New page in ${node.name}`}
                      onClick={() => onCreateInFolder(node.path)}
                    >
                      +
                    </button>
                  ) : null}
                </div>
                </div>
              </TreeContextMenu>

              {isOpen ? (
                <TreeBranch
                  nodes={node.children}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                  expanded={expanded}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  onCreateInFolder={onCreateInFolder}
                  onCreateFolderIn={onCreateFolderIn}
                  onRename={onRename}
                  onDelete={onDelete}
                  forceExpand={forceExpand}
                />
              ) : null}
            </li>
          );
        }

        const kind = getFileKind(node.name);
        const label = fileLabel(node.name);
        const fileTarget: TreeTarget = {
          kind: 'file',
          path: node.path,
          name: node.name,
          fileKind: kind,
        };

        return (
          <li key={node.path} className="admin-tree-node">
            <TreeContextMenu target={fileTarget} onRename={onRename} onDelete={onDelete}>
              <div
                className="admin-tree-row admin-tree-row-file"
                data-active={selectedPath === node.path}
                style={{ paddingInlineStart: `${depth * 0.875 + 1.35}rem` }}
              >
                <button
                  type="button"
                  className="admin-tree-label"
                  data-kind={kind}
                  data-active={selectedPath === node.path}
                  onClick={() => onSelect(node.path)}
                >
                  <FileIcon kind={kind} />
                  <span className="admin-tree-name">{label}</span>
                </button>
              </div>
            </TreeContextMenu>
          </li>
        );
      })}
    </ul>
  );
}

export function ContentTree({
  nodes,
  selectedPath,
  onSelect,
  onCreateInFolder,
  onCreateFolderIn,
  onRename,
  onDelete,
}: ContentTreeProps) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const sortedNodes = useMemo(() => sortNodes(nodes), [nodes]);
  const filteredNodes = useMemo(
    () => filterTree(sortedNodes, query),
    [sortedNodes, query],
  );
  const isFiltering = query.trim().length > 0;

  useEffect(() => {
    if (sortedNodes.length === 0) return;
    setExpanded((current) => {
      if (current.size > 0) return current;
      const next = defaultExpanded(sortedNodes);
      saveExpanded(next);
      return next;
    });
  }, [sortedNodes]);

  useEffect(() => {
    if (!selectedPath) return;
    setExpanded((current) => {
      const next = new Set(current);
      for (const folder of ancestorPaths(selectedPath)) {
        next.add(folder);
      }
      saveExpanded(next);
      return next;
    });
  }, [selectedPath]);

  const toggleFolder = useCallback((folderPath: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      saveExpanded(next);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const next = new Set(collectFolderPaths(sortedNodes));
    setExpanded(next);
    saveExpanded(next);
  }, [sortedNodes]);

  const collapseAll = useCallback(() => {
    const next = new Set<string>();
    if (selectedPath) {
      for (const folder of ancestorPaths(selectedPath)) {
        next.add(folder);
      }
    }
    setExpanded(next);
    saveExpanded(next);
  }, [selectedPath]);

  return (
    <div className="admin-file-tree">
      <div className="admin-tree-toolbar">
        <label className="sr-only" htmlFor={searchId}>
          Filter files
        </label>
        <input
          id={searchId}
          className="admin-tree-search"
          type="search"
          value={query}
          placeholder="Filter files…"
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="admin-tree-toolbar-actions">
          <button
            type="button"
            className="admin-tree-toolbar-btn"
            title="Expand all folders"
            onClick={expandAll}
          >
            Expand
          </button>
          <button
            type="button"
            className="admin-tree-toolbar-btn"
            title="Collapse all folders"
            onClick={collapseAll}
          >
            Collapse
          </button>
        </div>
      </div>

      <div className="admin-tree-scroll" role="tree" aria-label="Content files">
        {filteredNodes.length > 0 ? (
          <TreeBranch
            nodes={filteredNodes}
            depth={0}
            selectedPath={selectedPath}
            expanded={expanded}
            onToggle={toggleFolder}
            onSelect={onSelect}
            onCreateInFolder={onCreateInFolder}
            onCreateFolderIn={onCreateFolderIn}
            onRename={onRename}
            onDelete={onDelete}
            forceExpand={isFiltering}
          />
        ) : (
          <p className="admin-tree-empty">No files match your filter.</p>
        )}
      </div>
    </div>
  );
}
