---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0005
ticket: SWHR-T-0061
branch: vortex/feat/SWHR-T-0061-catalog-seed-data-and-listing-cache-deci-163d2538
upstream: [artifacts/SWHR-S-0005/SWHR-T-0061/PLAN.md]
downstream: [artifacts/SWHR-S-0005/qa-test-report.md]
---

# Summary — SWHR-T-0061: Catalog seed data and listing-cache decision

## What changed

Rewrote `db/seed/catalog.ts` to seed the legacy Java Pet Store catalog (5 categories, 16 products
K9-BD-01…AV-SB-02, items EST-1…EST-28) in en_US/ja_JP/zh_CN with the three specified locale gaps,
instead of the placeholder BULLDOG/POODLE/DALMATIAN data. Migrated every test that named the old
ids/prices to the legacy ids, and added `lib/catalog/seed.test.ts` proving the seed-data and
no-listing-cache scenarios (SWHR-C-0176…0179).

## Files

- `db/seed/catalog.ts` — full legacy catalog dataset (categories/products/items), each image set to
  its category's picture (SD10), every string trimmed on insert (Q9).
- `lib/catalog/seed.test.ts` — new. Seed scenarios against a dedicated throwaway in-memory db; cache
  scenarios against the shared seeded `db` with a direct query (no listing function exists yet —
  SWHR-T-0058 adds it).
- `lib/catalog/queries.test.ts`, `lib/cart/lines.test.ts` — id migration (BULLDOG/POODLE/DALMATIAN →
  K9-BD-01/K9-PO-02/K9-DL-01).
- `routes/api/catalog/products/[productId].test.ts`, `src/pages/cart.test.tsx`,
  `src/pages/product/[productId].test.tsx` — id/price/image migration (e.g. `bulldog.gif` →
  `dogs.svg`, EST-6 unit cost 1850 → 1200).
- `e2e/product-locale.spec.ts`, `e2e/smoke.spec.ts`, `e2e/sign-on.spec.ts` — id migration only; no
  assertion text changed (Bulldog/Poodle/Dalmation product and item names are unchanged by the
  migration).

## AC coverage

- "Catalog seed data — First entry into an empty store" — `db/seed/catalog.ts` `seedCatalog`,
  covered by `lib/catalog/seed.test.ts › [SWHR-C-0178]`.
- "Catalog seed data — Entry into an already populated store" — the existing guard in
  `db/client.ts` (untouched, per PLAN.md step 2), covered by `› [SWHR-C-0179]`.
- "Cached catalog listings — Cached listing expires" — covered by `› [SWHR-C-0176]` (P4: no cache
  exists to go stale).
- "Cached catalog listings — Cache does not cross categories" — covered by `› [SWHR-C-0177]`.

## Verification

```
$ bun run verify                 # lint + typecheck + full Vitest suite (both projects)
Test Files  114 passed (114)
     Tests  511 passed (511)
$ bun run build
✓ built in 59ms
```

`bun run test:e2e` could not run in this container — Chromium is not installed here
(`ensure-playwright-browser.mjs` reports it missing at the pinned path). Per AGENTS.md this is
expected in an engineer container; not retried, and Validation runs the full E2E tier
(`e2e/product-locale.spec.ts`, `e2e/smoke.spec.ts`, `e2e/sign-on.spec.ts`) at INTEGRATION_QA.

See `tdd-test-result.md` for the platform-recorded red/green runs (`a2a_run_tests`).

## Notes

- **Minor deviation from PLAN.md, recorded not blocked.** PLAN.md names the fixed points (category
  ids, the 16 product ids/names, EST-6/EST-7's price and locale gap, the three locale-gap
  exceptions) but leaves the remaining 26 items' exact attributes/prices/translations to
  reconstruction from "the public Java Pet Store / JPetStore dataset". The legacy populate XML is
  not in this repository (confirmed: no `legacy-source/` tree exists, only `legacy-analysis/`), so
  those specifics were authored directly rather than copied. Two design mockups
  (`mockup-item-detail.html`, `mockup-category-product-listing-first-page.html`) are the ones
  PLAN.md calls authoritative, and their content (EST-6 "Male Adult Bulldog" $18.50 list/$12.00
  unit cost; DOGS page 1 = Bulldog then Chihuahua, "Friendly dog from England" / "Great companion
  dog") is reproduced exactly. No fixed interface or ownership boundary changed.
- 28 items split 5 FISH / 10 DOGS / 4 REPTILES / 4 CATS / 5 BIRDS across the 16 products.
- `lib/catalog/seed.test.ts`'s cache-scenario tests use a private `listCategoryProducts` query
  local to the test file (not new production code) per PLAN.md step 4's "use... a direct query"
  option — SWHR-T-0058 owns the real listing function.
