# PLAN — SWHR-T-0006 Site shell: layout, header, Global navigation, footer

Change: `swhr-i-0002-bootstrap-landing-page-and-s` · requirements **Global navigation** (SWHR-R-0002), **Shared page layout** (SWHR-R-0003) · tasks.md group 3 (3.1, 3.2). Read `openspec/changes/swhr-i-0002-bootstrap-landing-page-and-s/design.md` first (§Decisions: One shell, One navigation; planning §Landmarks are the contract, SD-3).

## Objective

Every route renders inside one `SiteLayout`; no page draws its own chrome.

## Steps

1. `src/components/layout/SiteLayout.tsx`: `<header>` (banner) → `<nav aria-label="Global">` → `<main>` (children) → `<footer>`. Mount it in `src/main.tsx` around `useRoutes(routes)` (keep the Suspense; SWHR-T-0007 swaps its fallback).
2. `SiteHeader.tsx`: top strip with language labels (English / 日本語 / 中文 — no behaviour) and "Store staff: Administration · Supplier"; main row with logo (`<Link to="/">`, accessible name "Pet Store home"), search form (GET to `/search`, param `keywords`), Account, Cart, Sign in. Per SD-3 the header link row and the Pets menu sit inside the single "Global" nav.
3. `GlobalNav.tsx`: Home link + Pets menu (Birds…Reptiles from `PET_CATEGORIES`) + `PRIMARY_AREAS` links, rendered from `src/constants/navigation.ts` — no hard-coded second list. Below `lg`: a "Open menu" button opens a headlessui `Dialog` panel with the same entries and a "Close menu" button (reuse the pattern from the old template home page).
4. `SiteFooter.tsx`: © year Pet Store + links (Home, Shop by pet, Cart, Account, Administration, Supplier) inside `<nav aria-label="Footer">`.
5. Visible focus ring and 44px targets on every control (design/DESIGN-GUIDE.md §2).
6. Tests: `src/components/layout/SiteLayout.test.tsx` (SWHR-C-0007, SWHR-C-0005 — render layout + routes in a MemoryRouter at a non-root placeholder route such as `/cart`). `e2e/shell.spec.ts` for SWHR-C-0004 / 0006 / 0008 and the 375px menu panel.

## File/module ownership

`src/components/layout/SiteLayout.tsx`, `SiteHeader.tsx`, `GlobalNav.tsx`, `SiteFooter.tsx`, `index.ts`, `SiteLayout.test.tsx` (all new), `src/main.tsx`, `e2e/shell.spec.ts` (new). Read-only: `src/constants/navigation.ts`.

## Design reference

`artifacts/SWHR-S-0001/design/mockup-site-shell.html`, `wireframe-site-shell.html`; header/footer also visible in every other mockup. Index `MANIFEST.md`.

## Definition of Done

AC-1 … AC-8 on the ticket.
