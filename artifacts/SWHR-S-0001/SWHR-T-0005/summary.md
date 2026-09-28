---
ticket: SWHR-T-0005
type: summary
---

# Summary — SWHR-T-0005

Replaced the Vortex template hero at `/` with the Pet Store landing page, backed by a single primary-area list (`src/constants/navigation.ts`) that later capabilities (site shell, catalog) will reuse, and added placeholder pages for every primary-area route so no link on the landing page hits not-found.

## Design

Built the landing page's content (hero, "Shop by pet" cards, "Your account" and "Store staff" cards) from `artifacts/SWHR-S-0001/design/mockup-landing-page.html`, per `PLAN.md` step 3 — content only, no header/nav/footer (`SWHR-T-0006` owns the shell). The mockup's `aside` "Pets" panel, header search bar, util bar and footer belong to the shell and were intentionally not reproduced here.

## Files changed

- `src/constants/navigation.ts` (new) — `PET_CATEGORIES` (BIRDS/CATS/DOGS/FISH/REPTILES) and `PRIMARY_AREAS` (12 entries: the 5 category hrefs plus search, cart, checkout, account, signin, admin, supplier).
- `src/pages/index.tsx` — rewritten to the Pet Store landing page content, rendered from `PET_CATEGORIES`/`PRIMARY_AREAS`.
- `src/pages/index.test.tsx` — rewritten for `[SWHR-C-0003]`: renders in a `MemoryRouter`, asserts a link exists for every `PRIMARY_AREAS`/`PET_CATEGORIES` href.
- `e2e/home.spec.ts` — rewritten for `[SWHR-C-0002]`; template assertions (hero copy, tech-stack chips, mobile nav dialog, no-scrollbar check) removed.
- New placeholder pages, each a heading + one line of copy: `src/pages/category/[categoryId].tsx`, `search.tsx`, `cart.tsx`, `checkout.tsx`, `account.tsx`, `signin.tsx`, `admin/index.tsx`, `supplier/index.tsx`.
- Deleted `src/pages/about.tsx` and `src/pages/users/*` (template demo pages). `routes/api/users/*` kept — `e2e/smoke.spec.ts` still exercises it.

## Acceptance criteria coverage

- AC "landing page links to every primary area": `src/pages/index.test.tsx` (unit) + `e2e/home.spec.ts` (e2e).
- AC "fixed contract" (`PET_CATEGORIES`/`PRIMARY_AREAS` shape and hrefs): `src/constants/navigation.ts`.
- AC "every href resolves to a page": one placeholder page per route, file-based via `vite-plugin-pages`.
- AC "index.test.tsx asserts one link per entry" (`SWHR-C-0003`): implemented as described above.
- AC "e2e sees the main heading at '/'" (`SWHR-C-0002`): implemented as described above.
- AC "template hero/chips/about/users gone, e2e/home.spec.ts has no template assertions": done.

## Verification

- `bun --bun vitest run src/pages/index.test.tsx` — red confirmed against the old template page (3 failed), green after the rewrite (3 passed). See `tdd-test-result.md`.
- `bun run verify` (lint + typecheck + full unit suite): green — 8 test files, 20 tests passed.
- `bun run verify:full`: its E2E preflight reports Chromium is not installed in this container and directs falling back to `bun run verify` here (E2E runs in QA/CI) — not retried, per that guidance.

## Notes

- `PRIMARY_AREAS` is 12 entries (5 category hrefs + 7 others), matching `PET_CATEGORIES` for the category subset. The ticket's fixed-contract wording ("`/category/BIRDS` … `/category/REPTILES` via a 'Shop by pet' entry") is read as: those 5 hrefs are contributed by mapping over `PET_CATEGORIES`, not as one collapsed nav entry — this is what makes "asserts one link for every `PRIMARY_AREAS` entry and every `PET_CATEGORIES` entry" non-redundant to write and trivially satisfiable by the same rendered links.
- No deviations from `PLAN.md` requiring a contract/ownership change.
