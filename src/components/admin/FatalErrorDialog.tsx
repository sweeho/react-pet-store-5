import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { OctagonX } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";

export interface FatalErrorDialogProps {
  open: boolean;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

/** DESIGN.md §Dialogs: blocking, no action that continues the session. */
export default function FatalErrorDialog({
  open,
  title,
  message,
  actionLabel,
  onAction,
}: FatalErrorDialogProps): ReactElement {
  return (
    <Dialog open={open} onClose={() => {}} role="alertdialog" className="relative z-50">
      <div className="fixed inset-0 bg-gray-900/45" aria-hidden="true" />
      <div className="fixed inset-0 grid place-items-center p-4">
        <DialogPanel className="bg-background border-line-2 flex w-full max-w-125 flex-col gap-4 rounded-xl border p-7 shadow-xl">
          <div className="flex gap-4">
            <span
              aria-hidden="true"
              className="grid size-11 flex-none place-items-center rounded-full bg-red-100 text-red-800"
            >
              <OctagonX className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <p className="text-muted-foreground-2 mt-1.5">{message}</p>
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <Button type="button" onClick={onAction}>
              {actionLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
