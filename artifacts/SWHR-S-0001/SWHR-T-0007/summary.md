---
ticket: SWHR-T-0007
type: summary
---

# Summary — SWHR-T-0007

Added the shared `EmptyState`, `ErrorState`, `LoadingState` and `AsyncContent<T>` in `src/components/state/`, per the fixed contract, and wired them into the three places the app currently needs a state frame: the router's Suspense fallback, the not-found route, a real render-error boundary, and the eight placeholder pages.

## Design

Built `EmptyState`/`ErrorState` from `artifacts/SWHR-S-0001/design/mockup-empty-state.html` and `mockup-error-state.html` (`.frame`/`.ic`/`h2`/`p`/`.row` shape; icon circle, title, one line of copy, action row). `ErrorState`'s retry control reads "Try again" per SD-2 (the mockup, not `test-cases.md`'s "Retry" wording — tests query "Try again"). `LoadingState` is a skeleton per DESIGN-GUIDE §10.6 (no literal loading placeholder in the mockups beyond a "Loading items…" label). Actions reuse the existing raw-Tailwind + `cn()`/`FOCUS_RING` pattern from `GlobalNav.tsx`/`SiteHeader.tsx` rather than the underused `Button` UI primitive, to match the nearest existing files.

## Files changed

- `src/components/state/{EmptyState,ErrorState,LoadingState,AsyncContent}.tsx` + tests + `index.ts` barrel (new).
- `src/main.tsx` — Suspense fallback is now `<LoadingState />`; routed content is wrapped in `RootErrorBoundary`.
- `src/pages/RootErrorBoundary.tsx` — rewritten from a static, unwired functional component into a real class-based error boundary (`getDerivedStateFromError`) rendering `ErrorState`; "Try again" remounts the children under a fresh `key`.
- `src/pages/NotFound.tsx` — renders `ErrorState` with "Page not found" copy and no `onRetry`.
- `src/pages/[...all].test.tsx` — updated to the new copy/contract.
- `src/pages/RootErrorBoundary.test.tsx` (new) — catch + retry-remounts behavior.
- The eight placeholder pages (`search.tsx`, `cart.tsx`, `checkout.tsx`, `account.tsx`, `signin.tsx`, `admin/index.tsx`, `supplier/index.tsx`, `category/[categoryId].tsx`) — replaced their bespoke `<p>` copy with `<EmptyState title="Coming soon" ... />`, keeping each page's own `h1`.

## Acceptance criteria coverage

- "Empty frame" / "error frame with retry": `EmptyState.test.tsx`, `ErrorState.test.tsx`.
- Fixed contract (roles, test ids, `aria-busy`, conditional retry button, `AsyncContent` behavior): all four component tests.
- `AsyncContent` unit tests `SWHR-C-0009`/`0010`/`0011`: `AsyncContent.test.tsx`.
- Suspense fallback is `LoadingState`: `src/main.tsx`.
- Unknown route → `ErrorState` ("Page not found", Back to Home, no retry) inside the shell; render error → `RootErrorBoundary` → `ErrorState` → retry remounts: `[...all].test.tsx`, `RootErrorBoundary.test.tsx`.
- Placeholder pages render `EmptyState`: the eight page files above.

## Verification

- Red→green proven twice (state components import-failure red; wiring assertion-level red against the pre-ticket `NotFound`/`RootErrorBoundary`), both restored to green. See `tdd-test-result.md`.
- `bun run verify` (lint + typecheck + full unit suite): green — 14 files, 34 tests.
- `bun run verify:full`: E2E preflight reports Chromium is not installed in this container and directs falling back to `bun run verify` here (E2E runs in QA/CI) — not retried. No existing E2E spec references the old copy this ticket replaced.

## Notes

- `AsyncContent` drives its fetch off a `retryCount` state value (bumped by the retry handler) rather than calling a setState-invoking function directly inside its effect body — required to satisfy this project's `eslint-plugin-react-hooks` v7 `react-hooks/refs` and `react-hooks/set-state-in-effect` rules (`bun run lint --max-warnings 0`). Behavior is unchanged; see the note in `tdd-test-result.md`.
- No deviations from `PLAN.md` requiring a contract/ownership change.
