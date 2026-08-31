'use client';

import { useEffect, useId, useState } from 'react';

export type CreateItemKind = 'page' | 'folder';

type CreateItemDialogProps = {
  open: boolean;
  kind: CreateItemKind;
  parentLabel?: string;
  onClose: () => void;
  onSubmit: (title: string) => void;
};

export function CreateItemDialog({
  open,
  kind,
  parentLabel,
  onClose,
  onSubmit,
}: CreateItemDialogProps) {
  const titleId = useId();
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (open) setTitle('');
  }, [open]);

  if (!open) return null;

  const label = kind === 'folder' ? 'New folder' : 'New page';

  return (
    <div className="admin-dialog-backdrop" onClick={onClose} onKeyDown={() => {}} role="presentation">
      <div
        className="admin-dialog"
        role="dialog"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={() => {}}
      >
        <h2 id={titleId}>{label}</h2>
        {parentLabel ? (
          <p className="admin-muted">Inside <code>{parentLabel}</code></p>
        ) : null}
        <label className="admin-label" htmlFor={`${titleId}-input`}>
          Title
        </label>
        <input
          id={`${titleId}-input`}
          className="admin-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === 'folder' ? 'API' : 'Quickstart'}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) {
              onSubmit(title.trim());
            }
            if (e.key === 'Escape') onClose();
          }}
        />
        <div className="admin-dialog-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={!title.trim()}
            onClick={() => onSubmit(title.trim())}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
