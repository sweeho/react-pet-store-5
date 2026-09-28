---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0001
ticket: SWHR-T-0006
branch: vortex/feat/SWHR-T-0006-site-shell-shared-layout-with-header-glo-961b8c7b
upstream: [artifacts/SWHR-S-0001/SWHR-T-0006/PLAN.md]
downstream: [artifacts/SWHR-S-0001/qa-test-report.md]
---

# Summary — SWHR-T-0006: Site shell with header, Global navigation and footer on every page

## What changed

Added `src/components/layout/` (`SiteLayout`, `GlobalNav`, `SiteHeader`, `SiteFooter`,
`index.ts`) and mounted `SiteLayout` around the routed pages in `src/main.tsx`, so every
route now renders inside one header, one `nav aria-label="Global"`, `main` and `footer`
instead of drawing its own chrome. No page file was touched — the landing page and every
placeholder page render unchanged inside the new `main`.

## Files

- `src/components/layout/SiteLayout.tsx` — new. `export default function SiteLayout({ children })`
  composing `GlobalNav`, `<main>{children}</main>`, `SiteFooter` — the fixed banner→nav→main→footer
  contract.
- `src/components/layout/GlobalNav.tsx` — new. Owns the `<header>` (banner) and the nested
  `<nav aria-label="Global">` (SD-3: one landmark wraps both the header's actions and the pet
  category / area links), plus the below-`lg` menu button and headlessui `Dialog` panel.
- `src/components/layout/SiteHeader.tsx` — new. The header's visual content: language labels
  (no behaviour), staff links, logo, search form (navigates to `/search?keywords=…`), Account/
  Cart/Sign in.
- `src/components/layout/SiteFooter.tsx` — new. Owns the `<footer>` (contentinfo) with a
  `nav aria-label="Footer"` link list, distinct from "Global".
- `src/components/layout/index.ts` — new barrel, mirrors `src/components/ui/index.ts`.
- `src/components/layout/SiteLayout.test.tsx` — new, 4 tests (see `tdd-test-result.md`).
- `src/main.tsx` — wraps `<Suspense>{useRoutes(routes)}</Suspense>` in `<SiteLayout>` (Suspense
  kept per PLAN.md, only the routed content suspends — the shell itself doesn't).
- `e2e/shell.spec.ts` — new, 15 tests (13 routes × shell-visible + not-found + mobile panel).

## AC coverage

- AC-1/AC-2 (Global nav on every page, links back to landing page) — `GlobalNav.tsx`'s Home
  link (`href="/"`); `SiteLayout.test.tsx › [SWHR-C-0005]` clicks it from `/cart` and asserts
  the landing page renders; `e2e/shell.spec.ts`'s per-route loop asserts the link on every
  route.
- AC-3 (fixed `SiteLayout({children})` contract, one banner/nav/main/contentinfo in order) —
  `SiteLayout.tsx`; `SiteLayout.test.tsx › [SWHR-C-0007]` asserts single-instance + DOM order
  via `compareDocumentPosition`, with a child 'page body' inside `main`.
- AC-4 (Home link + one link per `PRIMARY_AREAS`/`PET_CATEGORIES` entry; footer nav named
  differently) — `GlobalNav.tsx` (`SiteHeader`'s Account/Cart/Sign in/Administration/Supplier
  links + the `hidden lg:flex` row for the 5 categories/Search/Checkout, all always mounted,
  not gated by the mobile Dialog) and `SiteFooter.tsx` (`nav aria-label="Footer"`);
  `SiteLayout.test.tsx`'s coverage test asserts every href is present, mirroring
  `src/pages/index.test.tsx`'s `[SWHR-C-0003]` pattern.
- AC-5 (logo/search/Account/Cart/Sign in/language labels; nothing throws) — `SiteHeader.tsx`;
  every control routes to an existing placeholder page from SWHR-T-0005 (`/account`, `/cart`,
  `/signin`, `/search`) or is a non-navigating button (language labels); build + full unit
  suite green with no runtime error.
- AC-6 (below-`lg` fold behind a menu button, panel with same entries, close button) —
  `GlobalNav.tsx`'s headlessui `Dialog`/`DialogPanel` (same pattern as the removed template
  home page); `SiteLayout.test.tsx › "opens the mobile menu panel and closes it again"` and
  `e2e/shell.spec.ts`'s 375px-viewport test.
- AC-7 (SiteLayout unit tests: SWHR-C-0007, SWHR-C-0005) — both present in
  `SiteLayout.test.tsx`, described above.
- AC-8 (e2e: every route + not-found visible; 375px menu open/close) — `e2e/shell.spec.ts`.

## Verification

```
$ bun run test -- src/components/layout   # red: import error with implementation moved aside; green: 4/4 after restoring
$ bun run verify                           # lint + typecheck + test, all green — 9 files, 24 tests
$ bun run build                            # tsc --build && vite build, exit 0
$ node scripts/check-doc-links.mjs         # 75 files checked, all relative links resolve
```

See `tdd-test-result.md` — `TDD-RESULT: 24 passed, 0 failed`.

`bun run test:e2e` (and therefore `verify:full`) was not run: this container's Chromium
(`/ms-playwright/chromium-1223`) doesn't match the project's pinned Playwright 1.50.1, which
expects `chromium-1155` — its preflight refuses rather than downloading a mismatched browser,
per `AGENTS.md`. CI (pinned correctly) is the recorded verdict for `e2e/shell.spec.ts`.

## Notes

- CI's first run caught a real bug `bun run verify` couldn't: the headlessui `Dialog` root
  (`role="dialog"`) had only `className="lg:hidden"`, no sizing of its own, while its
  children were both `fixed` — which don't contribute to a `position: static` parent's
  layout box, so the root collapsed to 0×0 and Playwright reported it as hidden even while
  open. Fixed by moving `fixed inset-0` onto the Dialog root in `GlobalNav.tsx`. Full detail
  and the failing log excerpt are in `tdd-test-result.md` → `## Red run`.
- The site-shell and landing-page mockups (`artifacts/SWHR-S-0001/design/mockup-site-shell.html`,
  `mockup-landing-page.html`) both show pet categories as a persistent `<aside>` sidebar on the
  content side, not a header control. That sidebar sits inside `.body`/`main` content in the
  mockups (a page-specific affordance for whichever capability owns that screen), and the
  ticket's Fixed Contract only names banner/nav/main/contentinfo — no `aside`/complementary
  landmark — so it is out of this ticket's scope; `SiteLayout` provides no aside. `GlobalNav`
  instead surfaces the same `PET_CATEGORIES` data as an inline "Pets" link row (`hidden lg:flex`)
  and in the mobile panel, satisfying AC-4's link-coverage requirement without inventing a
  sidebar the fixed contract doesn't call for.
- The `ring`/`input`/`accent` shadcn-alias tokens and the Preline token set itself are
  SWHR-T-0004's decisions, reused as-is here (e.g. `focus-visible:ring-ring`, `border-line-2`,
  `text-muted-foreground-1`) — no new tokens were introduced.
- Footer's "Shop by pet" link points at `/` (same as "Home") — PLAN.md names it but
  `src/constants/navigation.ts` has no "shop by pet" route of its own (only individual category
  routes); the landing page's category grid lives at `/`, so this is the closest true href
  rather than a `href="#"` placeholder.
- Search submits via `useNavigate` (`/search?keywords=…`) rather than a native form GET, so it
  works as a client-side transition under `react-router`'s declarative `useRoutes` (no data
  router / `<Form>` support is wired up in this app) without a full page reload.
