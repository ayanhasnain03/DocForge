'use client';

import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { BLOCK_LABELS } from '@/lib/admin/blocks';
import type { ContentBlock } from '@/lib/admin/blocks';
import { deferTask } from '@/lib/admin/defer';
import { attrsToBlock, blockToAttrs } from '@/lib/admin/mdx-document';
import { BlockItem } from '@/components/admin/block-item';

function blocksEqual(a: ContentBlock, b: ContentBlock): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function MdxBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const blockType = node.attrs.blockType as string;
  const blockData = node.attrs.blockData as string;

  const [block, setBlock] = useState(() => attrsToBlock({ blockType, blockData }));
  const blockRef = useRef(block);
  const skipSyncRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  blockRef.current = block;

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    const next = attrsToBlock({ blockType, blockData });
    deferTask(() => {
      setBlock((prev) => (blocksEqual(prev, next) ? prev : next));
    });
  }, [blockData, blockType]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function commitAttributes(next: ContentBlock) {
    deferTask(() => {
      updateAttributes(blockToAttrs(next));
    });
  }

  function handleChange(next: ContentBlock) {
    setBlock(next);
    skipSyncRef.current = true;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      commitAttributes(next);
    }, 150);
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    skipSyncRef.current = true;
    commitAttributes(blockRef.current);
  }

  const label = block.type === 'markdown' ? 'MDX component' : BLOCK_LABELS[block.type];

  return (
    <NodeViewWrapper className="notion-mdx-block" data-drag-handle>
      <div className="notion-mdx-block-inner" onBlur={handleBlur}>
        <header className="notion-mdx-block-head">
          <span>{label}</span>
          <button type="button" className="admin-icon-btn" onClick={() => deleteNode()} title="Remove">
            ×
          </button>
        </header>
        <BlockItem
          block={block}
          embedded
          onChange={handleChange}
          onRemove={() => deleteNode()}
        />
      </div>
    </NodeViewWrapper>
  );
}
