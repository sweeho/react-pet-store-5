---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0005
ticket: SWHR-T-0061
branch: vortex/feat/SWHR-T-0061-catalog-seed-data-and-listing-cache-deci-163d2538
upstream: [artifacts/SWHR-S-0005/SWHR-T-0061/PLAN.md]
---

# TDD result — SWHR-T-0061

This ticket has platform-linked test cases (`a2a_get_test_cases`). The red and green runs below
are the ones `a2a_run_tests` recorded; the DONE gate reads those records, not a typed marker.

## Test cases

| Case        | Test                                                                                                                                                          | Covers                                                         | Intent                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| SWHR-C-0178 | `lib/catalog/seed.test.ts › catalog seed data › [SWHR-C-0178] First entry into an empty store loads the bundled catalog before home`                          | AC "Catalog seed data — First entry into an empty store"       | empty catalog tables get the full bundled seed (5 categories, 28 items)                      |
| SWHR-C-0179 | `lib/catalog/seed.test.ts › catalog seed data › [SWHR-C-0179] Entry into a populated store does not reload data`                                              | AC "Catalog seed data — Entry into an already populated store" | a modified row survives, and the loader is not called, when the catalog is already populated |
| SWHR-C-0176 | `lib/catalog/seed.test.ts › cached catalog listings (P4 — no cache) › [SWHR-C-0176] DOGS listing cached 6 minutes ago is regenerated and shows a new product` | AC "Cached catalog listings — Cached listing expires"          | a product added after a first read is visible on the very next read (no cache to go stale)   |
| SWHR-C-0177 | `lib/catalog/seed.test.ts › cached catalog listings (P4 — no cache) › [SWHR-C-0177] Cached DOGS listing is not served for CATS`                               | AC "Cached catalog listings — Cache does not cross categories" | reading DOGS then CATS returns only CATS' own products                                       |

## Runs

- **Red** — run `63a78b5c-dca5-407f-8b78-d9f3e442c325` at commit `d12138ac4e6376616554e3930f7a5ebb00ea9b62`. Verdict: `recorded`/`valid`. All four cases: `assertion_failure` (against the pre-migration 3-product/4-item seed — e.g. `expected [...] to have a length of 28 but got 4`, `expected ['BULLDOG','DALMATIAN','POODLE'] to deeply equal [...legacy ids...]`).
- **Green** — run `e8139216-c81b-4489-aacd-63bcca176a77` at commit `4c80073a9ba4786fafec2e4a676156e4a5dba3b3`. All four cases: `pass`. The run's overall `valid` flag came back `false`, but every listed reason names a pre-existing file untouched by this ticket's diff (`.vortex/config.yaml`, and `tdd-test-result.md` files under `artifacts/SWHR-S-0003/` and `artifacts/SWHR-S-0004/` from earlier, already-merged tickets) that contains the literal text `VortexNotImplemented` in prose or config, not an actual unreplaced stub — `modified_after_red` is empty, confirming nothing in this ticket's own changes triggered it. Per this project's dispatch instructions, DONE is not gated on this run; it is recorded here as evidence.

## Notes

- The red commit intentionally touched only Vitest test files (`lib/catalog/seed.test.ts` new,
  plus the id/price migrations in `lib/catalog/queries.test.ts`, `lib/cart/lines.test.ts`,
  `routes/api/catalog/products/[productId].test.ts`, `src/pages/cart.test.tsx`,
  `src/pages/product/[productId].test.tsx`); `db/seed/catalog.ts` and the three `e2e/*.spec.ts`
  Playwright specs (classified as non-test files by the platform's red-commit check) were migrated
  in the follow-up implementation commit alongside the green run.
- Full pre-commit gate: `bun run verify` (lint + typecheck + the complete Vitest suite, both
  projects) — 511 passed, 0 failed. `bun run build` also passes. `bun run test:e2e` could not run
  in this container (Chromium is not installed here — see `summary.md` § Verification); Validation
  re-runs E2E at INTEGRATION_QA per AGENTS.md.
