'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ContentNode } from '@/lib/admin/content';
import {
  CreateItemDialog,
  type CreateItemKind,
} from '@/components/admin/create-item-dialog';
import { ConfirmActionDialog } from '@/components/admin/confirm-action-dialog';
import { ContentTree } from '@/components/admin/content-tree';
import { DeleteItemDialog } from '@/components/admin/delete-item-dialog';
import { DocEditor } from '@/components/admin/doc-editor';
import { NavEditor } from '@/components/admin/nav-editor';
import { RenameItemDialog } from '@/components/admin/rename-item-dialog';
import { useToast } from '@/components/admin/toast';
import { readApiError } from '@/lib/admin/api-client';
import { encodeContentPath } from '@/lib/admin/content-path';
import { savedMessage } from '@/lib/admin/save-messages';
import type { ContentSource } from '@/lib/admin/content-types';
import type { TreeTarget } from '@/lib/admin/tree-target';

type Tab = 'content' | 'navigation';

type PendingCreate = {
  kind: CreateItemKind;
  parent?: string;
};

function remapSelectedPath(
  selectedPath: string | null,
  oldPath: string,
  newPath: string,
): string | null {
  if (!selectedPath) return null;
  if (selectedPath === oldPath) return newPath;
  if (selectedPath.startsWith(`${oldPath}/`)) {
    return `${newPath}${selectedPath.slice(oldPath.length)}`;
  }
  return selectedPath;
}

export function AdminShell() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [tree, setTree] = useState<ContentNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('content');
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(null);
  const [pendingRename, setPendingRename] = useState<TreeTarget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TreeTarget | null>(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [treeActionLoading, setTreeActionLoading] = useState(false);

  const loadTree = useCallback(async () => {
    const response = await fetch('/api/admin/content');
    if (!response.ok) return;
    const data = (await response.json()) as { tree: ContentNode[] };
    setTree(data.tree);
  }, []);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  async function logout() {
    setTreeActionLoading(true);
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setTreeActionLoading(false);
    setConfirmLogoutOpen(false);
    router.push('/admin/login');
    router.refresh();
  }

  async function submitCreate(title: string) {
    if (!pendingCreate) return;

    const { kind, parent } = pendingCreate;
    setTreeActionLoading(true);

    const response = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        title,
        parent,
      }),
    });

    setTreeActionLoading(false);

    if (!response.ok) {
      const message = await readApiError(
        response,
        kind === 'folder' ? 'Could not create folder' : 'Could not create page',
      );
      showError(message);
      return;
    }

    const data = (await response.json()) as { path: string; source?: ContentSource };
    setPendingCreate(null);
    await loadTree();
    setSelectedPath(data.path);
    setTab('content');
    showSuccess(
      savedMessage(
        data.source,
        kind === 'folder' ? 'Folder created' : 'Page created',
      ),
    );
  }

  async function submitRename(name: string) {
    if (!pendingRename) return;

    setTreeActionLoading(true);
    const oldPath = pendingRename.path;

    const response = await fetch(`/api/admin/content/${encodeContentPath(oldPath)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    setTreeActionLoading(false);

    if (!response.ok) {
      const message = await readApiError(response, 'Could not rename item');
      showError(message);
      return;
    }

    const data = (await response.json()) as { path: string; source?: ContentSource };
    setPendingRename(null);
    await loadTree();
    setSelectedPath((current) => remapSelectedPath(current, oldPath, data.path));
    showSuccess(savedMessage(data.source, 'Renamed'));
  }

  async function submitDelete() {
    if (!pendingDelete) return;

    setTreeActionLoading(true);
    const targetPath = pendingDelete.path;

    const response = await fetch(`/api/admin/content/${encodeContentPath(targetPath)}`, {
      method: 'DELETE',
    });

    setTreeActionLoading(false);

    if (!response.ok) {
      const message = await readApiError(response, 'Could not delete item');
      showError(message);
      return;
    }

    const data = (await response.json()) as { source?: ContentSource };
    setPendingDelete(null);
    setSelectedPath((current) => {
      if (!current) return null;
      if (current === targetPath || current.startsWith(`${targetPath}/`)) return null;
      return current;
    });
    await loadTree();
    showSuccess(savedMessage(data.source, 'Deleted'));
  }

  const isMeta = selectedPath?.endsWith('meta.json') ?? false;

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-start">
          <p className="admin-kicker">Harc docs</p>
          <h1>Content admin</h1>
        </div>
        <div className="admin-header-tabs">
          <button
            type="button"
            className="admin-tab"
            data-active={tab === 'content'}
            onClick={() => setTab('content')}
          >
            Pages
          </button>
          <button
            type="button"
            className="admin-tab"
            data-active={tab === 'navigation'}
            onClick={() => setTab('navigation')}
          >
            Navigation
          </button>
        </div>
        <div className="admin-header-end">
          <a className="admin-btn admin-btn-ghost" href="/" target="_blank" rel="noreferrer">
            View site
          </a>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            onClick={() => setConfirmLogoutOpen(true)}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-body">
        {tab === 'content' ? (
          <>
            <aside className="admin-sidebar">
              <div className="admin-sidebar-head">
                <div className="admin-sidebar-title">
                  <span className="admin-sidebar-label">Explorer</span>
                  <span className="admin-sidebar-root">content/docs</span>
                </div>
                <div className="admin-sidebar-actions">
                  <button
                    type="button"
                    className="admin-tree-action"
                    title="New folder at root"
                    onClick={() => setPendingCreate({ kind: 'folder' })}
                  >
                    ⊞
                  </button>
                  <button
                    type="button"
                    className="admin-tree-action"
                    title="New page at root"
                    onClick={() => setPendingCreate({ kind: 'page' })}
                  >
                    +
                  </button>
                </div>
              </div>
              <ContentTree
                nodes={tree}
                selectedPath={selectedPath}
                onSelect={(path) => {
                  setSelectedPath(path);
                }}
                onCreateInFolder={(folderPath) =>
                  setPendingCreate({ kind: 'page', parent: folderPath })
                }
                onCreateFolderIn={(folderPath) =>
                  setPendingCreate({ kind: 'folder', parent: folderPath })
                }
                onRename={setPendingRename}
                onDelete={setPendingDelete}
              />
            </aside>
            <main className="admin-main">
              {selectedPath && !isMeta ? (
                <DocEditor
                  key={selectedPath}
                  path={selectedPath}
                  onSaved={() => {}}
                  onDeleted={async () => {
                    setSelectedPath(null);
                    await loadTree();
                  }}
                />
              ) : selectedPath && isMeta ? (
                <NavEditor
                  key={selectedPath}
                  path={selectedPath}
                  onSaved={() => {}}
                />
              ) : (
                <div className="admin-empty">
                  <p>Select a file from the tree, or create a new page or folder.</p>
                </div>
              )}
            </main>
          </>
        ) : (
          <div className="admin-nav-full">
            <NavEditor path="meta.json" onSaved={() => {}} />
          </div>
        )}
      </div>

      <CreateItemDialog
        open={pendingCreate !== null}
        kind={pendingCreate?.kind ?? 'page'}
        parentLabel={pendingCreate?.parent}
        onClose={() => setPendingCreate(null)}
        onSubmit={(title) => void submitCreate(title)}
        loading={treeActionLoading}
      />

      <RenameItemDialog
        open={pendingRename !== null}
        target={pendingRename}
        onClose={() => setPendingRename(null)}
        onSubmit={(name) => void submitRename(name)}
        loading={treeActionLoading}
      />

      <DeleteItemDialog
        open={pendingDelete !== null}
        target={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void submitDelete()}
        loading={treeActionLoading}
      />

      <ConfirmActionDialog
        open={confirmLogoutOpen}
        title="Sign out?"
        description="You will need your admin key to sign in again."
        confirmLabel="Sign out"
        loading={treeActionLoading}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={() => void logout()}
      />
    </div>
  );
}
