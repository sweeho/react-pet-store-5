---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0005
ticket: SWHR-T-0057
branch: vortex/feat/SWHR-T-0057-catalog-data-model-attributes-length-che-af8d6440
upstream: [artifacts/SWHR-S-0005/SWHR-T-0057/PLAN.md]
---

# TDD result — SWHR-T-0057

This ticket carries platform-approved test cases (`a2a_get_test_cases`). The red and green runs
below are the platform-recorded runs from `a2a_run_tests`, which the DONE gate reads directly.

## Test cases

| Case        | Test                                                                                                                                         | Intent                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| SWHR-C-0149 | `lib/catalog/schema.test.ts › category schema constraints › [SWHR-C-0149] rejects category details saved without a name`                     | NOT NULL on `categoryDetails.name`                                  |
| SWHR-C-0150 | `lib/catalog/schema.test.ts › category schema constraints › [SWHR-C-0150] rejects a second details row for the same category and locale`     | PK `(categoryId, locale)` rejects a duplicate                       |
| SWHR-C-0152 | `lib/catalog/schema.test.ts › product schema constraints › [SWHR-C-0152] rejects a product referencing a missing category`                   | `PRAGMA foreign_keys = ON` enforces `product.categoryId`            |
| SWHR-C-0153 | `lib/catalog/schema.test.ts › item schema constraints › [SWHR-C-0153] stores item prices as exact decimals, without floating-point rounding` | stored integer minor units round-trip through `formatPrice` exactly |
| SWHR-C-0154 | `lib/catalog/schema.test.ts › item schema constraints › [SWHR-C-0154] rejects item details saved without a unit cost`                        | NOT NULL on `itemDetails.unitCost`                                  |

## Runs

- Red run `506690b4-7873-4ce2-a127-ccd4b1959843` (`a2a_run_tests(phase: "red")`, commit `c889494`): **invalid**. `SWHR-C-0152` genuinely failed (`assertion_failure`) — foreign keys were declared but never enforced. `SWHR-C-0149`, `SWHR-C-0150`, `SWHR-C-0153`, `SWHR-C-0154` each report `pass`: the NOT NULL constraints on `categoryDetails.name`/`itemDetails.unitCost`, the composite primary key `(categoryId, locale)`, and the integer-minor-unit price storage all predate this ticket (present since the localization migration, `drizzle/0002_gray_the_hood.sql`) — this ticket makes no change relevant to those four cases. See `## Notes`.
- Green run: `Pending Verification` — see `## Notes`; disputed with planning before recording, per the platform's own instruction not to weaken, skip or rewrite an approved case.

## Notes

Four of the five approved cases (SWHR-C-0149, -0150, -0153, -0154) describe database constraints that
already existed in `db/schema.ts` before this ticket — `categoryDetails.name` and `itemDetails.unitCost`
have been `NOT NULL`, and `categoryDetails`/`itemDetails` have carried their composite primary key,
since the localization ticket's migration (`drizzle/0002_gray_the_hood.sql`). Prices have always been
stored as integer minor units, which `lib/locale/money.ts#formatPrice` already formatted exactly. This
ticket's actual delta against the schema is `PRAGMA foreign_keys = ON` (SWHR-C-0152), the five item
attributes, and the length `CHECK` constraints (SD2/SD4 in `design.md`) — none of which have approved
cases beyond SWHR-C-0152.

Per the `a2a_run_tests` contract, a red run is valid only when every citing test fails; these four
cannot be driven red without deliberately regressing already-shipped, unrelated behavior, which is not
this ticket's job and which I was instructed not to do (do not weaken, skip or rewrite a case).
Disputed each via `a2a_dispute_test_case` rather than gaming the gate — see the ticket comment thread
and the dispute reasons for the exact evidence. `lib/catalog/schema.test.ts` still carries and passes
all five cases (plus supplementary coverage for the length/attribute constraints), so the behavior is
proven either way; only the platform's red/green bookkeeping for these four is unresolved pending
Planning's re-approval/retirement decision.

All 507 tests pass (113 files): `bun run verify` — lint, typecheck, and the complete unit suite, green.
`bun run verify:full`'s E2E preflight reports Chromium genuinely not installed in this container; per
AGENTS.md this is the documented fallback (E2E runs in the QA/CI containers), not retried.
