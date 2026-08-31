'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/admin/toast';
import { NotionEditor } from '@/components/admin/notion-editor/notion-editor';
import { readApiError } from '@/lib/admin/api-client';
import { validateDocPayload } from '@/lib/admin/validate';

type DocEditorProps = {
  path: string;
  onSaved: () => void;
  onDeleted: () => void;
};

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
  const bodyRef = useRef('');

  bodyRef.current = body;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setFieldError('');
      const response = await fetch(`/api/admin/content/${path.split('/').map(encodeURIComponent).join('/')}`);
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

  async function save() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });

    const validation = validateDocPayload(
      { title, description },
      bodyRef.current,
    );
    if (!validation.ok) {
      setFieldError(validation.error);
      showError(validation.error);
      return;
    }

    setSaving(true);
    setFieldError('');
    const response = await fetch(
      `/api/admin/content/${path.split('/').map(encodeURIComponent).join('/')}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontmatter: { title: title.trim(), description: description.trim() || undefined },
          body: bodyRef.current,
        }),
      },
    );
    setSaving(false);
    if (!response.ok) {
      const message = await readApiError(response, 'Save failed');
      setFieldError(message);
      showError(message);
      return;
    }
    showSuccess('Page saved');
    onSaved();
  }

  async function remove() {
    if (!window.confirm(`Delete ${path}?`)) return;
    const response = await fetch(
      `/api/admin/content/${path.split('/').map(encodeURIComponent).join('/')}`,
      { method: 'DELETE' },
    );
    if (!response.ok) {
      const message = await readApiError(response, 'Delete failed');
      setFieldError(message);
      showError(message);
      return;
    }
    showSuccess('Page deleted');
    onDeleted();
  }

  if (loading) {
    return <div className="admin-empty">Loading…</div>;
  }

  const previewUrl = `/${path.replace(/\.mdx$/, '').replace(/\/index$/, '').replace(/^index$/, '')}`;

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
            onClick={() => void remove()}
          >
            Delete
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : 'Save'}
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
    </div>
  );
}
