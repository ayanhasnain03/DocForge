'use client';

import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { TreeTarget } from '@/lib/admin/tree-target';
import { treeTargetLabel } from '@/lib/admin/tree-target';

type RenameItemDialogProps = {
  open: boolean;
  target: TreeTarget | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
  loading?: boolean;
};

export function RenameItemDialog({
  open,
  target,
  onClose,
  onSubmit,
  loading = false,
}: RenameItemDialogProps) {
  const inputId = useId();
  const [name, setName] = useState('');

  useEffect(() => {
    if (open && target) {
      setName(treeTargetLabel(target));
    }
  }, [open, target]);

  const label = target?.kind === 'folder' ? 'Folder name' : 'Page name';

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>Rename {target?.kind === 'folder' ? 'folder' : 'page'}</DialogTitle>
          {target ? (
            <DialogDescription>
              Current path: <code>{target.path}</code>
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
            <Input
              id={inputId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={target?.kind === 'folder' ? 'API' : 'Quickstart'}
              autoFocus
              disabled={loading}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && name.trim() && !loading) {
                  onSubmit(name.trim());
                }
              }}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!name.trim() || loading}
            onClick={() => onSubmit(name.trim())}
          >
            {loading ? 'Renaming…' : 'Rename'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
