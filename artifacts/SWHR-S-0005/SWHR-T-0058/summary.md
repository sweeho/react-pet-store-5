---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0005
ticket: SWHR-T-0058
branch: vortex/feat/SWHR-T-0058-catalog-queries-locale-scoped-listings-l-6f9a3c79
upstream: [artifacts/SWHR-S-0005/SWHR-T-0058/PLAN.md]
downstream:
  [
    artifacts/SWHR-S-0005/SWHR-T-0059/PLAN.md,
    artifacts/SWHR-S-0005/SWHR-T-0060/PLAN.md,
    artifacts/SWHR-S-0005/SWHR-T-0062/PLAN.md,
  ]
---

# Summary — SWHR-T-0058: Catalog queries: locale-scoped listings, lookups, paging and keyword search

## What changed

Added the locale-scoped read functions the storefront needs, per the fixed contracts in `PLAN.md`:

- `lib/catalog/paging.ts` (new): `DEFAULT_PAGE_SIZE`, `PageInfo`/`Page<T>`, and `buildPage`, which shapes
  a page from up to `count + 1` fetched rows (P1) — `previousStart` follows the legacy rule (start minus
  results on this page, floored at zero; Q3/D7).
- `lib/catalog/errors.ts` (new): `CatalogError` + `toCatalogError` (P2) — every exported query catches a
  store failure and rethrows it as `CatalogError`, no retry.
- `lib/catalog/queries.ts`: added `listCategories`, `getCategory`, `listProducts`, `listItems`,
  `parseKeywords`, `searchItems`. Extended `ItemView` additively (`categoryId`, `productName`,
  `attributes`) and updated `getItem`/`listProductItems` to populate it via a join against `product`
  (recovers the correct category id — D4, the legacy DAO swapped it). `getProduct` is unchanged.
  Categories/products order by localized name then id; items and search results order by item id (Q8).
  Search is whitespace-tokenized, de-duplicated (blank → empty page without querying), and matches
  case-insensitively against the localized product name, the category identifier, or the localized item
  description, using drizzle's `sql`/`like` helpers with `%`/`_` escaped per keyword.

## Files

- `lib/catalog/paging.ts`, `lib/catalog/paging.test.ts` — new.
- `lib/catalog/errors.ts` — new.
- `lib/catalog/queries.ts` — new query functions; `ItemView` extended; `getItem`/`listProductItems`
  updated to the extended shape.
- `lib/catalog/queries.test.ts` — one or more named tests per AC/case; existing `getProduct`/
  `listProductItems`/`getItem` coverage kept.
- `src/pages/product/[productId].test.tsx` — fixture fix: the `ItemView` fixture gained
  `categoryId`/`productName`/`attributes` to match the extended, additive type. No behavior change.

## AC coverage

All 20 acceptance criteria are proven by named tests citing their case key — see
`tdd-test-result.md`'s `## Test cases` table for the case → test mapping. Two scenarios use an in-test
fixture rather than the seed, per `PLAN.md` step 7: the REPTILES-without-zh_CN category (SWHR-C-0156, the
seeded REPTILES already has all three locales since SWHR-T-0061) and the 5-item paging product
(SWHR-C-0168/-0169/-0170). A third fixture was added beyond `PLAN.md`'s list: a FISH item with no en_US
details (SWHR-C-0167 v2 — the case was revised after `PLAN.md` was written to require proving the
"with details in the locale" exclusion, and every seeded FISH item already has en_US details) — a minor
deviation, recorded here rather than blocking.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
NODE_ENV=test bun --bun vitest run
 Test Files  115 passed (115)
      Tests  540 passed (540)
```

`bun run verify:full` was attempted; its E2E preflight reports Chromium is genuinely not installed in
this container, so E2E was not run here (per AGENTS.md, this is the documented fallback — E2E runs in
the QA/CI containers). This ticket carries platform-linked test cases, so `tdd-test-result.md` carries
the recorded run ids rather than a `TDD-RESULT:` marker.

## Notes

**Red commit redone once.** The platform's red gate requires a red commit to be purely additive — no
existing production code may be modified, only new stub declarations added. The first attempt modified
`getItem`/`listProductItems`/`toCatalogError` in place and was correctly rejected; fixed by restoring
those functions and the original `ItemView`/`ProductView` interfaces byte-for-byte and appending the new
exports as pure additions. See `tdd-test-result.md` for detail.

**SWHR-C-0162 disputed, not blocking.** `getItem`'s null-return for a missing locale predates this ticket
(same mechanism as the existing EST-9/ja_JP test); a valid red wasn't obtainable without regressing
unrelated, already-shipped behavior. Disputed via `a2a_dispute_test_case`; the platform confirmed this
project doesn't gate on the outcome. The case's test passes either way — see `tdd-test-result.md`.

**Green run's `invalid` verdict is the known whole-repo stub-sentinel scanner issue** (filed as
SWHR-T-0065 during SWHR-T-0057), not a defect in this ticket's code: every one of the 20 approved cases
reports `pass` and none was modified after red. No new follow-up needed; SWHR-T-0065 already covers it,
and this run adds one more recurrence to its evidence (this ticket's own `tdd-test-result.md`, once
committed, will itself be flagged as one more false positive for the next ticket).
