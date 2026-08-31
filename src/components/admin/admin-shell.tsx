'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ContentNode } from '@/lib/admin/content';
import {
  CreateItemDialog,
  type CreateItemKind,
} from '@/components/admin/create-item-dialog';
import { ContentTree } from '@/components/admin/content-tree';
import { DocEditor } from '@/components/admin/doc-editor';
import { NavEditor } from '@/components/admin/nav-editor';
import { useToast } from '@/components/admin/toast';
import { readApiError } from '@/lib/admin/api-client';

type Tab = 'content' | 'navigation';

type PendingCreate = {
  kind: CreateItemKind;
  parent?: string;
};

export function AdminShell() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [tree, setTree] = useState<ContentNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('content');
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(null);

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
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  }

  async function submitCreate(title: string) {
    if (!pendingCreate) return;

    const { kind, parent } = pendingCreate;
    setPendingCreate(null);

    const response = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        title,
        parent,
      }),
    });

    if (!response.ok) {
      const message = await readApiError(
        response,
        kind === 'folder' ? 'Could not create folder' : 'Could not create page',
      );
      showError(message);
      return;
    }

    const data = (await response.json()) as { path: string };
    await loadTree();
    setSelectedPath(data.path);
    setTab('content');
    showSuccess(kind === 'folder' ? 'Folder created' : 'Page created');
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
          <button type="button" className="admin-btn admin-btn-ghost" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-body">
        {tab === 'content' ? (
          <>
            <aside className="admin-sidebar">
              <div className="admin-sidebar-head">
                <span>Files</span>
                <div className="admin-sidebar-actions">
                  <button
                    type="button"
                    className="admin-icon-btn"
                    title="New folder"
                    onClick={() => setPendingCreate({ kind: 'folder' })}
                  >
                    ⊞
                  </button>
                  <button
                    type="button"
                    className="admin-icon-btn"
                    title="New page"
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
              />
            </aside>
            <main className="admin-main">
              {selectedPath && !isMeta ? (
                <DocEditor
                  key={selectedPath}
                  path={selectedPath}
                  onSaved={() => showSuccess('Saved')}
                  onDeleted={async () => {
                    setSelectedPath(null);
                    await loadTree();
                  }}
                />
              ) : selectedPath && isMeta ? (
                <NavEditor
                  key={selectedPath}
                  path={selectedPath}
                  onSaved={() => showSuccess('Navigation saved')}
                />
              ) : (
                <div className="admin-empty">
                  <p>Select a page from the sidebar, or create a new page or folder.</p>
                </div>
              )}
            </main>
          </>
        ) : (
          <div className="admin-nav-full">
            <NavEditor path="meta.json" onSaved={() => showSuccess('Root navigation saved')} />
          </div>
        )}
      </div>

      <CreateItemDialog
        open={pendingCreate !== null}
        kind={pendingCreate?.kind ?? 'page'}
        parentLabel={pendingCreate?.parent}
        onClose={() => setPendingCreate(null)}
        onSubmit={(title) => void submitCreate(title)}
      />
    </div>
  );
}
