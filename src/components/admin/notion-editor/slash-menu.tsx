'use client';

import type { Editor } from '@tiptap/core';
import { useEffect, useRef, useState } from 'react';
import {
  filterInsertItems,
  runInsertAction,
  type InsertItem,
} from '@/components/admin/notion-editor/insert-actions';

type SlashMenuProps = {
  editor: Editor;
  open: boolean;
  query: string;
  position: { top: number; left: number };
  onClose: () => void;
};

export function SlashMenu({ editor, open, query, position, onClose }: SlashMenuProps) {
  const [active, setActive] = useState(0);
  const items = filterInsertItems(query);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((i) => (i + 1) % Math.max(items.length, 1));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((i) => (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1));
      }
      if (event.key === 'Enter' && items[active]) {
        event.preventDefault();
        pick(items[active]);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, items, active, onClose]);

  function pick(item: InsertItem) {
    runInsertAction(editor, item, true);
    onClose();
  }

  if (!open || items.length === 0) return null;

  const groups = [
    { id: 'basic', label: 'Text' },
    { id: 'list', label: 'Lists' },
    { id: 'media', label: 'Media' },
    { id: 'component', label: 'Components' },
  ] as const;

  let index = -1;

  return (
    <div
      ref={menuRef}
      className="notion-slash-menu"
      style={{ top: position.top, left: position.left }}
      role="listbox"
    >
      {groups.map((group) => {
        const groupItems = items.filter((item) => item.group === group.id);
        if (groupItems.length === 0) return null;

        return (
          <div key={group.id} className="notion-slash-group">
            <p className="notion-slash-group-label">{group.label}</p>
            {groupItems.map((item) => {
              index += 1;
              const current = index;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="notion-slash-item"
                  data-active={current === active}
                  onMouseEnter={() => setActive(current)}
                  onClick={() => pick(item)}
                >
                  <span className="notion-slash-item-icon">{item.icon}</span>
                  <span className="notion-slash-item-text">
                    <span className="notion-slash-item-label">{item.label}</span>
                    <span className="notion-slash-item-desc">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
