'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Shown inside the dialog when the confirmed action failed. */
  error?: string | null;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

// Hebrew confirmation dialog for destructive actions (delete patient, session,
// report). The confirm button is red; Escape / the close button / "ביטול" all
// cancel without acting.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'מחק',
  cancelLabel = 'ביטול',
  error,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !loading && onCancel()}>
      <DialogContent size="sm" role="alertdialog" data-testid="confirm-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" data-testid="confirm-dialog-error" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <DialogFooter className="gap-2 sm:gap-2 sm:space-x-0">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={() => void onConfirm()} loading={loading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
