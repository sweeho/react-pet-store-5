---
ticket: SWHR-T-0007
type: tdd-test-result
---

# TDD result — SWHR-T-0007

## Test cases

- `src/components/state/EmptyState.test.tsx` — renders `role="status"`, `data-testid="empty-state"`, the title, an optional description and an optional action.
- `src/components/state/ErrorState.test.tsx` — renders `role="alert"`, `data-testid="error-state"`, a "Back to Home" link to `/`; the "Try again" button appears only when `onRetry` is given and calls it on click.
- `src/components/state/LoadingState.test.tsx` — renders `role="status"`, `aria-busy="true"`, `data-testid="loading-state"`.
- `src/components/state/AsyncContent.test.tsx`:
  - `[SWHR-C-0009]` a `load` resolving to `[]` shows the empty frame and no list items.
  - `[SWHR-C-0010]` a rejecting `load` shows the error frame with a visible "Try again" button and no data/empty frame.
  - `[SWHR-C-0011]` rejecting once then resolving: clicking "Try again" calls `load` a second time, clears the error frame and renders the items.
- `src/pages/RootErrorBoundary.test.tsx` — catches a thrown render error and shows the error frame with "Try again"; clicking "Try again" re-mounts the children (a component that only throws on its first mount recovers).
- `src/pages/[...all].test.tsx` — the catch-all route shows the error frame with "Page not found" copy, a "Back to Home" link, and no "Try again" button.

## Red run

Two separate red→green cycles, each reproduced by temporarily removing/reverting the implementation while keeping the new tests, then restoring it.

**State components** (`bun --bun vitest run src/components/state`), with `EmptyState.tsx`/`ErrorState.tsx`/`LoadingState.tsx`/`AsyncContent.tsx` moved aside:

```
FAIL  src/components/state/EmptyState.test.tsx — Failed to resolve import "./EmptyState"
FAIL  src/components/state/ErrorState.test.tsx — Failed to resolve import "./ErrorState"
FAIL  src/components/state/LoadingState.test.tsx — Failed to resolve import "./LoadingState"
FAIL  src/components/state/AsyncContent.test.tsx — Failed to resolve import "./AsyncContent"

 Test Files  4 failed (4)
      Tests  no tests
```

**Wiring** (`bun --bun vitest run 'src/pages/[...all].test.tsx' src/pages/RootErrorBoundary.test.tsx`), with `src/pages/NotFound.tsx` and `src/pages/RootErrorBoundary.tsx` stashed back to their pre-ticket (template) versions:

```
FAIL src/pages/[...all].test.tsx > renders the shared error frame with 'Page not found' copy...
  Unable to find role="alert"
FAIL src/pages/RootErrorBoundary.test.tsx > catches a render error and shows the shared error frame with Try again
  Unable to find role="alert"
FAIL src/pages/RootErrorBoundary.test.tsx > Try again re-mounts the children instead of re-rendering the failed instance
  Unable to find role="alert"

 Test Files  2 failed (2)
      Tests  3 failed (3)
```

## Green run

Command (full pre-commit gate, per `AGENTS.md` → `verify`): `bun run verify` (= `bun run lint && bun run typecheck && bun run test`)

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run

 Test Files  14 passed (14)
      Tests  34 passed (34)
```

`bun run verify:full` was attempted; its preflight (`scripts/ensure-playwright-browser.mjs`) reports Chromium is not installed in this container and directs falling back to `bun run verify` (E2E runs in the QA phase / CI) — not retried, per that guidance. This ticket's `PLAN.md` did not call for a new/changed E2E spec, and no existing `e2e/*.spec.ts` references the old NotFound/error-boundary copy (checked by grep), so the E2E tier has nothing new to cover here.

Note: an intermediate `AsyncContent` implementation (a ref assigned during render, plus a synchronous `setState` call inside `useEffect`) failed `bun run lint` under this project's `eslint-plugin-react-hooks` v7 recommended rules (`react-hooks/refs`, `react-hooks/set-state-in-effect`). Fixed by syncing the `load` ref in its own no-deps effect and driving the fetch off a `retryCount` state value instead of calling a setState-invoking function synchronously inside the effect body — see `AsyncContent.tsx`.

TDD-RESULT: 34 passed, 0 failed
