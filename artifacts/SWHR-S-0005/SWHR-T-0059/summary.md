---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0005
ticket: SWHR-T-0059
branch: vortex/feat/SWHR-T-0059-catalog-server-routes-categories-product-498cb17c
upstream: [artifacts/SWHR-S-0005/SWHR-T-0059/PLAN.md]
downstream: [artifacts/SWHR-S-0005/qa-test-report.md]
---

# Summary — SWHR-T-0059: Catalog server routes: categories, products, items and search

## What changed

Added four read-only, anonymous JSON routes under `routes/api/catalog/` (categories, one
category's products, one item, search) on top of SWHR-T-0058's query layer, and extended the
existing product route with paging. Extracted the shared locale/paging/error-mapping logic into
`lib/catalog/request.ts`.

## Files

- `lib/catalog/request.ts` — new. `resolveLocale` (the product route's existing `?locale=`-or-session
  pattern, now shared), `resolvePaging` (start/count validation, P3), `withCatalogErrorHandling`
  (CatalogError → 503/CATALOG_ERROR mapping, P2).
- `routes/api/catalog/categories/index.get.ts` — new. `{ categories }`.
- `routes/api/catalog/categories/[categoryId].get.ts` — new. `{ category, items, paging }`; unknown
  category answers 200 with `category: null` and an empty page (SD6).
- `routes/api/catalog/items/[itemId].get.ts` — new. `{ item }`; 404 when missing in the locale.
- `routes/api/catalog/search.get.ts` — new. `{ keywords, items, paging }` for `?keywords=`.
- `routes/api/catalog/products/[productId].get.ts` — now uses `lib/catalog/request.ts` and
  `listItems` (paged) instead of the unpaged `listProductItems`; response gains `paging`. 404
  behavior unchanged.
- `routes/api/catalog/categories/index.test.ts`, `[categoryId].test.ts`, `items/[itemId].test.ts`,
  `search.test.ts`, `products/[productId].test.ts` (extended), `anonymous-access.test.ts` (new),
  `lib/catalog/request.test.ts` (new) — route/unit tests.
- `e2e/catalog-anonymous-access.spec.ts` — new. Real browser/server proof of anonymous access.

## AC coverage

- "Anonymous catalog access — Visitor who is not signed on browses" — none of the five routes read
  sign-on state or sit behind `configs/signon-config.json`'s `protectedPages`; covered by
  `routes/api/catalog/anonymous-access.test.ts › [SWHR-C-0174]` (bare `H3Event`, no auth middleware
  run first) and `e2e/catalog-anonymous-access.spec.ts › [SWHR-C-0174]` (real server, 200s, no
  redirect to `/signin`).
- "Read-only catalog operations and failure behaviour — Catalog store unavailable" —
  `lib/catalog/request.ts`'s `withCatalogErrorHandling`, used by every route; covered by
  `routes/api/catalog/categories/index.test.ts › [SWHR-C-0175]` and the equivalent 503 test added
  to each of the other four route test files.

## Verification

```
$ bun run verify                 # lint + typecheck + full Vitest suite (both projects)
Test Files  121 passed (121)
     Tests  581 passed (581)
$ bun run build
✓ built in 96ms
```

`bun run test:e2e` could not run in this container — Chromium is not installed here
(`ensure-playwright-browser.mjs` reports it missing at the pinned path). Per AGENTS.md this is
expected in an engineer container; not retried. Validation runs the full E2E tier, including
`e2e/catalog-anonymous-access.spec.ts`, at INTEGRATION_QA.

See `tdd-test-result.md` for the platform-recorded red/green runs (`a2a_run_tests`).

## Notes

- **Minor deviation from PLAN.md, recorded not blocked.** PLAN step 1 places the error-mapping
  logic's _behavior_ (P2) in step 3 without naming its file; since every route needs the identical
  `CatalogError` → 503 mapping, it was added to `lib/catalog/request.ts` alongside the
  locale/paging helpers PLAN step 1 does assign there, rather than repeated five times. No fixed
  interface or ownership boundary changed — the five response shapes and the 400/404/503 behaviour
  match PLAN exactly.
- The existing `listProductItems` (unpaged) in `lib/catalog/queries.ts` is now unused by the product
  route but was left in place — that file is owned by SWHR-T-0058, not this ticket, and its own
  tests (`lib/catalog/queries.test.ts`) still exercise it directly.
- SWHR-C-0174 is declared as an `e2e`-level case, but the category/product/item/search _screens_
  are still placeholders (SWHR-T-0060 builds them) — a full-page Playwright journey would exercise
  nothing this ticket built. `e2e/catalog-anonymous-access.spec.ts` instead drives the real running
  server's API routes directly via Playwright's `request` fixture, which is genuine end-to-end
  evidence for what this ticket actually delivers.
