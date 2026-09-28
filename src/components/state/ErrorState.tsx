import { RefreshCw, TriangleAlert } from "lucide-react";
import { Link } from "react-router";

import { cn } from "@/utils";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const DEFAULT_TITLE = "We couldn't load this page";
const DEFAULT_DESCRIPTION =
  "Something went wrong on our side and nothing was changed. Try again, or go back to the home page.";

/**
 * Shared error frame (design.md § "Shared states"; SD-2 — the control reads
 * "Try again", matching the mockup, even though test-cases.md calls it
 * "Retry"). Reused by not-found, the render-error boundary and any page
 * whose data fails to load via AsyncContent.
 */
export default function ErrorState({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      data-testid="error-state"
      className="border-line-2 bg-card flex flex-col items-center gap-3 rounded-xl border px-8 py-18 text-center"
    >
      <div className="bg-destructive/10 text-destructive mb-2 flex size-14 items-center justify-center rounded-full">
        <TriangleAlert aria-hidden="true" className="size-6.5" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground-2 max-w-md">{description}</p>
      <div className="mt-3 flex gap-2.5">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              "bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold",
              FOCUS_RING,
            )}
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Try again
          </button>
        ) : null}
        <Link
          to="/"
          className={cn(
            "border-line-2 bg-background hover:bg-background-1 inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold",
            FOCUS_RING,
          )}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
