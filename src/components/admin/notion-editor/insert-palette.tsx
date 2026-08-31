'use client';

import type { Editor } from '@tiptap/core';
import { useState } from 'react';
import { INSERT_ITEMS, runInsertAction } from '@/components/admin/notion-editor/insert-actions';

type InsertPaletteProps = {
  editor: Editor;
};

const GROUPS = [
  { id: 'basic', label: 'Text' },
  { id: 'list', label: 'Lists' },
  { id: 'media', label: 'Media' },
  { id: 'component', label: 'Components' },
] as const;

export function InsertPalette({ editor }: InsertPaletteProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="notion-insert">
      <button
        type="button"
        className="notion-insert-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="notion-insert-plus">+</span>
        Insert block
      </button>

      {open ? (
        <div className="notion-insert-panel">
          {GROUPS.map((group) => {
            const items = INSERT_ITEMS.filter((item) => item.group === group.id);
            if (items.length === 0) return null;

            return (
              <div key={group.id} className="notion-insert-group">
                <p className="notion-insert-group-label">{group.label}</p>
                <div className="notion-insert-grid">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="notion-insert-card"
                      onClick={() => {
                        runInsertAction(editor, item);
                        setOpen(false);
                      }}
                    >
                      <span className="notion-insert-card-icon">{item.icon}</span>
                      <span className="notion-insert-card-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
