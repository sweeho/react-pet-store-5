import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  text: string;
  note?: string;
  confirmLabel: string;
  /** Omit for an information dialog with a single action. */
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/** DESIGN.md §Dialogs: a confirmation names its consequence, never "OK". */
export default function ConfirmDialog({
  open,
  title,
  text,
  note,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement {
  return (
    <Dialog open={open} onClose={() => (onCancel ?? onConfirm)()} className="relative z-50">
      <div className="fixed inset-0 bg-gray-900/45" aria-hidden="true" />
      <div className="fixed inset-0 grid place-items-center p-4">
        <DialogPanel className="bg-background border-line-2 flex w-full max-w-125 flex-col gap-4 rounded-xl border p-7 shadow-xl">
          <div className="flex gap-4">
            <span
              aria-hidden="true"
              className="grid size-11 flex-none place-items-center rounded-full bg-yellow-100 text-yellow-800"
            >
              <TriangleAlert className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <p className="text-muted-foreground-2 mt-1.5">{text}</p>
              {note ? <p className="text-muted-foreground-1 mt-2.5 text-sm">{note}</p> : null}
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2.5">
            {cancelLabel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                {cancelLabel}
              </Button>
            ) : null}
            <Button
              type="button"
              variant={cancelLabel ? "destructive" : "default"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
