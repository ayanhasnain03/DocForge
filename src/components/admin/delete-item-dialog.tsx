'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { TreeTarget } from '@/lib/admin/tree-target';
import { deleteTargetDescription, treeTargetLabel } from '@/lib/admin/tree-target';

type DeleteItemDialogProps = {
  open: boolean;
  target: TreeTarget | null;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function DeleteItemDialog({
  open,
  target,
  onClose,
  onConfirm,
  loading = false,
}: DeleteItemDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {target ? treeTargetLabel(target) : 'item'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {target ? deleteTargetDescription(target) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={loading}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
