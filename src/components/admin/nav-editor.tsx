'use client';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/admin/toast';
import { readApiError } from '@/lib/admin/api-client';
import { validateMetaPayload } from '@/lib/admin/validate';

type NavEditorProps = {
  path: string;
  onSaved: () => void;
};

type MetaData = {
  title?: string;
  description?: string;
  icon?: string;
  root?: boolean;
  defaultOpen?: boolean;
  collapsible?: boolean;
  pages?: string[];
};

function SortablePageRow({
  id,
  value,
  onChange,
  onRemove,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="admin-nav-row">
      <button type="button" className="admin-drag-handle" {...attributes} {...listeners}>
        ⋮⋮
      </button>
      <input
        className="admin-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='slug, "...", "---Label---", or "[Text](url)"'
      />
      <button type="button" className="admin-icon-btn" onClick={onRemove}>
        ×
      </button>
    </div>
  );
}

export function NavEditor({ path, onSaved }: NavEditorProps) {
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState<MetaData>({ pages: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const pages = data.pages ?? [];
  const pageIds = pages.map((_, index) => `page-${index}`);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const response = await fetch(
        `/api/admin/content/${path.split('/').map(encodeURIComponent).join('/')}`,
      );
      if (!response.ok) {
        const message = await readApiError(response, 'Could not load navigation');
        setFieldError(message);
        showError(message);
        setLoading(false);
        return;
      }
      const payload = (await response.json()) as { data: MetaData };
      setData(payload.data);
      setLoading(false);
    }
    void load();
  }, [path, showError]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pageIds.indexOf(String(active.id));
    const newIndex = pageIds.indexOf(String(over.id));
    setData((prev) => ({
      ...prev,
      pages: arrayMove(prev.pages ?? [], oldIndex, newIndex),
    }));
  }

  async function save() {
    const validation = validateMetaPayload(data as Record<string, unknown>);
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
        body: JSON.stringify({ data }),
      },
    );
    setSaving(false);
    if (!response.ok) {
      const message = await readApiError(response, 'Save failed');
      setFieldError(message);
      showError(message);
      return;
    }
    showSuccess('Navigation saved');
    onSaved();
  }

  if (loading) return <div className="admin-empty">Loading navigation…</div>;

  return (
    <div className="admin-nav-editor">
      <div className="admin-editor-toolbar">
        <div className="admin-editor-path">
          <code>{path}</code>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? 'Saving…' : 'Save navigation'}
        </button>
      </div>

      {fieldError ? <p className="admin-error">{fieldError}</p> : null}

      <div className="admin-frontmatter">
        <label className="admin-label" htmlFor="nav-title">
          Sidebar title
        </label>
        <input
          id="nav-title"
          className="admin-input"
          value={data.title ?? ''}
          onChange={(e) => setData({ ...data, title: e.target.value })}
        />

        <label className="admin-label" htmlFor="nav-description">
          Description
        </label>
        <input
          id="nav-description"
          className="admin-input"
          value={data.description ?? ''}
          onChange={(e) => setData({ ...data, description: e.target.value })}
        />

        <label className="admin-label" htmlFor="nav-icon">
          Icon (Lucide name)
        </label>
        <input
          id="nav-icon"
          className="admin-input"
          value={data.icon ?? ''}
          onChange={(e) => setData({ ...data, icon: e.target.value })}
          placeholder="Package"
        />

        <div className="admin-checks">
          <label className="admin-check">
            <input
              type="checkbox"
              checked={data.root ?? false}
              onChange={(e) => setData({ ...data, root: e.target.checked })}
            />
            Root section
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={data.defaultOpen ?? false}
              onChange={(e) => setData({ ...data, defaultOpen: e.target.checked })}
            />
            Open by default
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={data.collapsible ?? false}
              onChange={(e) => setData({ ...data, collapsible: e.target.checked })}
            />
            Collapsible
          </label>
        </div>
      </div>

      <div className="admin-nav-pages">
        <div className="admin-nav-pages-head">
          <h2>Page order</h2>
          <p className="admin-muted">
            Drag to reorder. Use <code>...</code> for auto-include, <code>---Label---</code> for
            separators, <code>[Text](url)</code> for links.
          </p>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
            <div className="admin-nav-list">
              {pages.map((page, index) => (
                <SortablePageRow
                  key={pageIds[index]}
                  id={pageIds[index]}
                  value={page}
                  onChange={(value) => {
                    const next = [...pages];
                    next[index] = value;
                    setData({ ...data, pages: next });
                  }}
                  onRemove={() =>
                    setData({ ...data, pages: pages.filter((_, i) => i !== index) })
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          type="button"
          className="admin-chip"
          onClick={() => setData({ ...data, pages: [...pages, 'new-page'] })}
        >
          + Page entry
        </button>
      </div>
    </div>
  );
}
