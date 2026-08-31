'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BLOCK_LABELS,
  type ContentBlock,
  type FileTreeItem,
} from '@/lib/admin/blocks';
import { handleTextareaTabKey } from '@/lib/admin/textarea-keys';

type BlockItemProps = {
  block: ContentBlock;
  onChange: (block: ContentBlock) => void;
  onRemove: () => void;
  embedded?: boolean;
};

export function BlockItem({ block, onChange, onRemove, embedded = false }: BlockItemProps) {
  const sortable = useSortable({ id: block.id, disabled: embedded });

  const style = embedded
    ? undefined
    : {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      };

  const fields = renderFields(block, onChange);

  if (embedded) {
    return <div className="admin-block-body">{fields}</div>;
  }

  return (
    <article
      ref={sortable.setNodeRef}
      style={style}
      className="admin-block"
      data-dragging={sortable.isDragging}
    >
      <header className="admin-block-head">
        <button type="button" className="admin-drag-handle" {...sortable.attributes} {...sortable.listeners}>
          ⋮⋮
        </button>
        <span className="admin-block-type">{BLOCK_LABELS[block.type]}</span>
        <button type="button" className="admin-icon-btn" onClick={onRemove} title="Remove block">
          ×
        </button>
      </header>

      <div className="admin-block-body">{fields}</div>
    </article>
  );
}

function renderFields(block: ContentBlock, onChange: (block: ContentBlock) => void) {
  switch (block.type) {
    case 'markdown':
      return (
        <textarea
          className="admin-textarea"
          rows={6}
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          onKeyDown={(e) =>
            handleTextareaTabKey(e, (content) => onChange({ ...block, content }))
          }
          placeholder="Write markdown here…"
        />
      );
    case 'heading':
      return (
        <div className="admin-field-row">
          <select
            className="admin-select"
            value={block.level}
            onChange={(e) =>
              onChange({ ...block, level: Number(e.target.value) as 2 | 3 | 4 })
            }
          >
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
          </select>
          <input
            className="admin-input"
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
          />
        </div>
      );
    case 'code':
      return (
        <>
          <input
            className="admin-input"
            value={block.language}
            onChange={(e) => onChange({ ...block, language: e.target.value })}
            placeholder="Language (bash, ts, json…)"
          />
          <textarea
            className="admin-textarea admin-code"
            rows={8}
            value={block.code}
            onChange={(e) => onChange({ ...block, code: e.target.value })}
            onKeyDown={(e) =>
              handleTextareaTabKey(e, (code) => onChange({ ...block, code }))
            }
            spellCheck={false}
          />
        </>
      );
    case 'callout':
      return (
        <>
          <div className="admin-field-row">
            <select
              className="admin-select"
              value={block.calloutType}
              onChange={(e) =>
                onChange({
                  ...block,
                  calloutType: e.target.value as typeof block.calloutType,
                })
              }
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
              <option value="idea">Idea</option>
            </select>
            <input
              className="admin-input"
              value={block.title ?? ''}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
              placeholder="Title (optional)"
            />
          </div>
          <textarea
            className="admin-textarea"
            rows={4}
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            onKeyDown={(e) =>
              handleTextareaTabKey(e, (content) => onChange({ ...block, content }))
            }
          />
        </>
      );
    case 'tabs':
      return (
        <div className="admin-nested-list">
          {block.items.map((tab, index) => (
            <div key={`${block.id}-tab-${index}`} className="admin-nested-item">
              <div className="admin-field-row">
                <input
                  className="admin-input"
                  value={tab.label}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[index] = { ...tab, label: e.target.value };
                    onChange({ ...block, items });
                  }}
                  placeholder="Tab label"
                />
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={() =>
                    onChange({ ...block, items: block.items.filter((_, i) => i !== index) })
                  }
                >
                  ×
                </button>
              </div>
              <textarea
                className="admin-textarea admin-code"
                rows={6}
                value={tab.content}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...tab, content: e.target.value };
                  onChange({ ...block, items });
                }}
                onKeyDown={(e) =>
                  handleTextareaTabKey(e, (content) => {
                    const items = [...block.items];
                    items[index] = { ...tab, content };
                    onChange({ ...block, items });
                  })
                }
                placeholder={'```bash\nbun add package\n```'}
                spellCheck={false}
              />
            </div>
          ))}
          <button
            type="button"
            className="admin-chip"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { label: 'tab', content: '```bash\n\n```' }],
              })
            }
          >
            + Tab
          </button>
        </div>
      );
    case 'accordions':
      return (
        <div className="admin-nested-list">
          <select
            className="admin-select"
            value={block.accordionType ?? 'single'}
            onChange={(e) =>
              onChange({
                ...block,
                accordionType: e.target.value as 'single' | 'multiple',
              })
            }
          >
            <option value="single">Single open</option>
            <option value="multiple">Multiple open</option>
          </select>
          {block.items.map((item, index) => (
            <div key={`${block.id}-acc-${index}`} className="admin-nested-item">
              <div className="admin-field-row">
                <input
                  className="admin-input"
                  value={item.title}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[index] = { ...item, title: e.target.value };
                    onChange({ ...block, items });
                  }}
                  placeholder="Accordion title"
                />
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={() =>
                    onChange({ ...block, items: block.items.filter((_, i) => i !== index) })
                  }
                >
                  ×
                </button>
              </div>
              <textarea
                className="admin-textarea"
                rows={3}
                value={item.content}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...item, content: e.target.value };
                  onChange({ ...block, items });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="admin-chip"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { title: 'New item', content: '' }],
              })
            }
          >
            + Accordion
          </button>
        </div>
      );
    case 'cards':
      return (
        <div className="admin-nested-list">
          {block.items.map((card, index) => (
            <div key={`${block.id}-card-${index}`} className="admin-nested-item">
              <div className="admin-field-row">
                <input
                  className="admin-input"
                  value={card.title}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[index] = { ...card, title: e.target.value };
                    onChange({ ...block, items });
                  }}
                  placeholder="Title"
                />
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={() =>
                    onChange({ ...block, items: block.items.filter((_, i) => i !== index) })
                  }
                >
                  ×
                </button>
              </div>
              <input
                className="admin-input"
                value={card.description ?? ''}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...card, description: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Description"
              />
              <input
                className="admin-input"
                value={card.href ?? ''}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...card, href: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Link href"
              />
            </div>
          ))}
          <button
            type="button"
            className="admin-chip"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { title: 'Card', description: '', href: '/' }],
              })
            }
          >
            + Card
          </button>
        </div>
      );
    case 'steps':
      return (
        <div className="admin-nested-list">
          {block.items.map((step, index) => (
            <div key={`${block.id}-step-${index}`} className="admin-field-row">
              <span className="admin-step-num">{index + 1}</span>
              <input
                className="admin-input"
                value={step}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = e.target.value;
                  onChange({ ...block, items });
                }}
              />
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() =>
                  onChange({ ...block, items: block.items.filter((_, i) => i !== index) })
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="admin-chip"
            onClick={() => onChange({ ...block, items: [...block.items, 'New step'] })}
          >
            + Step
          </button>
        </div>
      );
    case 'files':
      return (
        <FileTreeEditor
          items={block.items}
          onChange={(items) => onChange({ ...block, items })}
        />
      );
    case 'github':
      return (
        <div className="admin-field-row">
          <input
            className="admin-input"
            value={block.owner}
            onChange={(e) => onChange({ ...block, owner: e.target.value })}
            placeholder="Owner"
          />
          <input
            className="admin-input"
            value={block.repo}
            onChange={(e) => onChange({ ...block, repo: e.target.value })}
            placeholder="Repository"
          />
        </div>
      );
  }
}

function FileTreeEditor({
  items,
  onChange,
}: {
  items: FileTreeItem[];
  onChange: (items: FileTreeItem[]) => void;
}) {
  return (
    <div className="admin-nested-list">
      {items.map((item, index) => (
        <div key={`file-${index}`} className="admin-nested-item">
          {item.kind === 'file' ? (
            <div className="admin-field-row">
              <span className="admin-muted">File</span>
              <input
                className="admin-input"
                value={item.name}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { kind: 'file', name: e.target.value };
                  onChange(next);
                }}
              />
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <div className="admin-field-row">
                <span className="admin-muted">Folder</span>
                <input
                  className="admin-input"
                  value={item.name}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...item, name: e.target.value };
                    onChange(next);
                  }}
                />
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={item.defaultOpen ?? false}
                    onChange={(e) => {
                      const next = [...items];
                      next[index] = { ...item, defaultOpen: e.target.checked };
                      onChange(next);
                    }}
                  />
                  Open
                </label>
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </div>
              <FileTreeEditor
                items={item.children}
                onChange={(children) => {
                  const next = [...items];
                  next[index] = { ...item, children };
                  onChange(next);
                }}
              />
            </>
          )}
        </div>
      ))}
      <div className="admin-field-row">
        <button
          type="button"
          className="admin-chip"
          onClick={() => onChange([...items, { kind: 'file', name: 'file.ts' }])}
        >
          + File
        </button>
        <button
          type="button"
          className="admin-chip"
          onClick={() =>
            onChange([
              ...items,
              { kind: 'folder', name: 'folder', defaultOpen: true, children: [] },
            ])
          }
        >
          + Folder
        </button>
      </div>
    </div>
  );
}
