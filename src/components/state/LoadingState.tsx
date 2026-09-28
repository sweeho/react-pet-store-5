export interface LoadingStateProps {
  label?: string;
}

/**
 * Shared loading frame (design.md § "Shared states"; DESIGN-GUIDE §10.6 —
 * a skeleton holding the content area's shape, so layout doesn't shift when
 * content arrives). Used as the router's Suspense fallback and by
 * AsyncContent while `load` is pending.
 */
export default function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      data-testid="loading-state"
      className="border-line-2 bg-card flex flex-col gap-4 rounded-xl border p-8"
    >
      <span className="sr-only">{label}</span>
      <div className="bg-background-2 h-6 w-1/3 animate-pulse rounded-md" aria-hidden="true" />
      <div className="bg-background-2 h-4 w-full animate-pulse rounded-md" aria-hidden="true" />
      <div className="bg-background-2 h-4 w-5/6 animate-pulse rounded-md" aria-hidden="true" />
      <div className="bg-background-2 h-32 w-full animate-pulse rounded-md" aria-hidden="true" />
    </div>
  );
}
