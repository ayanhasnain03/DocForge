'use client';

import { useEffect, useRef, useState } from 'react';
import { ConfirmActionDialog } from '@/components/admin/confirm-action-dialog';
import { useToast } from '@/components/admin/toast';
import { NotionEditor } from '@/components/admin/notion-editor/notion-editor';
import { readApiError } from '@/lib/admin/api-client';
import { encodeContentPath } from '@/lib/admin/content-path';
import { savedMessage } from '@/lib/admin/save-messages';
import type { ContentSource } from '@/lib/admin/content-types';
import { validateDocPayload } from '@/lib/admin/validate';

type DocEditorProps = {
  path: string;
  onSaved: () => void;
  onDeleted: () => void;
};

type PendingConfirm = 'save' | 'delete' | null;

export function DocEditor({ path, onSaved, onDeleted }: DocEditorProps) {
  const { showSuccess, showError } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [editorSeed, setEditorSeed] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [writeSession, setWriteSession] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const bodyRef = useRef('');

  bodyRef.current = body;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setFieldError('');
      const response = await fetch(`/api/admin/content/${encodeContentPath(path)}`);
      if (!response.ok) {
        const message = await readApiError(response, 'Could not load page');
        setFieldError(message);
        showError(message);
        setLoading(false);
        return;
      }
      const data = (await response.json()) as {
        frontmatter: { title: string; description?: string };
        body: string;
      };
      setTitle(data.frontmatter.title);
      setDescription(data.frontmatter.description ?? '');
      setBody(data.body);
      setEditorSeed(data.body);
      setWriteSession((n) => n + 1);
      setShowRaw(false);
      setLoading(false);
    }
    void load();
  }, [path, showError]);

  function switchToWrite() {
    setEditorSeed(bodyRef.current);
    setWriteSession((n) => n + 1);
    setShowRaw(false);
  }

  function requestSave() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const validation = validateDocPayload(
      { title, description },
      bodyRef.current,
    );
    if (!validation.ok) {
      setFieldError(validation.error);
      showError(validation.error);
      return;
    }

    setPendingConfirm('save');
  }

  async function save() {
    setSaving(true);
    setFieldError('');
    const response = await fetch(`/api/admin/content/${encodeContentPath(path)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frontmatter: { title: title.trim(), description: description.trim() || undefined },
        body: bodyRef.current,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      const message = await readApiError(response, 'Save failed');
      setFieldError(message);
      showError(message);
      return;
    }
    const data = (await response.json()) as { source?: ContentSource };
    setPendingConfirm(null);
    showSuccess(savedMessage(data.source, 'Page saved'));
    onSaved();
  }

  async function remove() {
    setSaving(true);
    const response = await fetch(`/api/admin/content/${encodeContentPath(path)}`, {
      method: 'DELETE',
    });
    setSaving(false);
    if (!response.ok) {
      const message = await readApiError(response, 'Delete failed');
      setFieldError(message);
      showError(message);
      return;
    }
    const data = (await response.json()) as { source?: ContentSource };
    setPendingConfirm(null);
    showSuccess(savedMessage(data.source, 'Page deleted'));
    onDeleted();
  }

  if (loading) {
    return <div className="admin-empty">Loading…</div>;
  }

  const previewUrl = `/${path.replace(/\.mdx$/, '').replace(/\/index$/, '').replace(/^index$/, '')}`;
  const displayTitle = title.trim() || path;

  return (
    <div className="admin-editor">
      <div className="admin-editor-toolbar">
        <div className="admin-editor-path">
          <code>{path}</code>
          <a href={previewUrl} target="_blank" rel="noreferrer" className="admin-link">
            Preview
          </a>
        </div>
        <div className="admin-editor-actions">
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            data-active={!showRaw}
            onClick={() => {
              if (showRaw) switchToWrite();
            }}
          >
            Write
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            data-active={showRaw}
            onClick={() => setShowRaw(true)}
          >
            Raw MDX
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            disabled={saving}
            onClick={() => setPendingConfirm('delete')}
          >
            Delete
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={saving}
            onClick={requestSave}
          >
            Save
          </button>
        </div>
      </div>

      {fieldError ? <p className="admin-error">{fieldError}</p> : null}

      <div className="admin-frontmatter">
        <label className="admin-label" htmlFor="doc-title">
          Title
        </label>
        <input
          id="doc-title"
          className="admin-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={fieldError.includes('Title') ? true : undefined}
        />
        <label className="admin-label" htmlFor="doc-description">
          Description
        </label>
        <textarea
          id="doc-description"
          className="admin-textarea"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {showRaw ? (
        <textarea
          className="admin-raw-editor"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          spellCheck={false}
        />
      ) : (
        <NotionEditor
          key={`${path}-${writeSession}`}
          initialContent={editorSeed}
          onChange={setBody}
        />
      )}

      <ConfirmActionDialog
        open={pendingConfirm === 'save'}
        title="Save page?"
        description={`Save changes to "${displayTitle}" at ${path}? This updates the live docs content.`}
        confirmLabel="Save"
        loading={saving}
        onClose={() => setPendingConfirm(null)}
        onConfirm={() => void save()}
      />

      <ConfirmActionDialog
        open={pendingConfirm === 'delete'}
        title="Delete page?"
        description={`Delete "${displayTitle}" (${path}) permanently. This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={saving}
        onClose={() => setPendingConfirm(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
