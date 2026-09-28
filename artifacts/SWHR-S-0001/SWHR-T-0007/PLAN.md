# PLAN — SWHR-T-0007 Shared empty, error and loading frames

Change: `swhr-i-0002-bootstrap-landing-page-and-s` · requirement **Shared state frames** (SWHR-R-0004) · tasks.md group 4 (4.1–4.3). Read `openspec/changes/swhr-i-0002-bootstrap-landing-page-and-s/design.md` first (§Decisions: Shared states; planning §State frames API, SD-2).

## Objective

One set of state frames that every page reuses, and a data-loading wrapper that picks between them.

## Steps

1. `src/components/state/EmptyState.tsx`, `ErrorState.tsx`, `LoadingState.tsx` to the ticket's fixed contract, styled from the empty/error mockups (icon, title, one line of copy, actions). `ErrorState` button text "Try again" (SD-2); link "Back to Home" → `/`. `LoadingState` is a skeleton block holding the content area's shape (DESIGN-GUIDE §10.6).
2. `src/components/state/AsyncContent.tsx`: generic wrapper per the contract; retry re-invokes `load`; ignore a stale result if the component unmounted. Barrel `src/components/state/index.ts`.
3. `src/main.tsx`: Suspense fallback → `<LoadingState />`.
4. `src/pages/NotFound.tsx` → `ErrorState` with "Page not found" copy, no `onRetry`. `src/pages/RootErrorBoundary.tsx` → a React error boundary (class component) rendering `ErrorState` whose `onRetry` resets it; wrap the routed content with it inside `SiteLayout`'s main via `src/main.tsx` (SiteLayout itself is unchanged).
5. Placeholder pages from SWHR-T-0005 → `EmptyState` ("coming soon" copy), keeping each page's h1.
6. Tests: `EmptyState.test.tsx`, `ErrorState.test.tsx`, `AsyncContent.test.tsx` (SWHR-C-0009 / 0010 / 0011); update `src/pages/[...all].test.tsx` to the new not-found copy.

## File/module ownership

`src/components/state/*` (new, incl. tests), `src/main.tsx`, `src/pages/NotFound.tsx`, `src/pages/RootErrorBoundary.tsx`, `src/pages/[...all].test.tsx`, the eight placeholder pages created by SWHR-T-0005.

## Design reference

`artifacts/SWHR-S-0001/design/mockup-empty-state.html`, `mockup-error-state.html`, `wireframe-empty-state.html`, `wireframe-error-state.html`; the loading placeholder appears in `mockup-site-shell.html`. Index `MANIFEST.md`.

## Definition of Done

AC-1 … AC-6 on the ticket.
