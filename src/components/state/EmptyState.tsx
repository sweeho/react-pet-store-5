import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Shared empty frame (design.md § "Shared states"; DESIGN-GUIDE §10.6 —
 * "an invitation: one line of what goes here, one button to create the
 * first one"). Every page with nothing to show renders this instead of
 * bespoke markup.
 */
export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      data-testid="empty-state"
      className="border-line-2 bg-card flex flex-col items-center gap-3 rounded-xl border px-8 py-18 text-center"
    >
      <div className="bg-background-2 text-muted-foreground-2 mb-2 flex size-14 items-center justify-center rounded-full">
        <Inbox aria-hidden="true" className="size-6.5" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description ? <p className="text-muted-foreground-2 max-w-md">{description}</p> : null}
      {action ? <div className="mt-3 flex gap-2.5">{action}</div> : null}
    </div>
  );
}
