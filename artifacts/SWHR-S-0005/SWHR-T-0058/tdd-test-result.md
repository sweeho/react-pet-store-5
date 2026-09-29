---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0005
ticket: SWHR-T-0058
branch: vortex/feat/SWHR-T-0058-catalog-queries-locale-scoped-listings-l-6f9a3c79
upstream: [artifacts/SWHR-S-0005/SWHR-T-0058/PLAN.md]
---

# TDD result — SWHR-T-0058

This ticket carries platform-approved test cases (`a2a_get_test_cases`). The red and green runs
below are the platform-recorded runs from `a2a_run_tests`, which the DONE gate reads directly (this
project does not block DONE on these runs, per the ticket's own instructions — they are recorded as
evidence).

## Test cases

| Case        | Test                                                                                | Intent                                                         |
| ----------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| SWHR-C-0148 | `queries.test.ts › getCategory › [SWHR-C-0148] …`                                   | `getCategory` returns Japanese details, id "DOGS" both locales |
| SWHR-C-0151 | `queries.test.ts › listProducts › [SWHR-C-0151] …`                                  | K9-BD-01 listed only under DOGS                                |
| SWHR-C-0155 | `queries.test.ts › listItems › [SWHR-C-0155] …` and `searchItems › [SWHR-C-0155] …` | EST-15 hidden from ja_JP listing AND search                    |
| SWHR-C-0156 | `queries.test.ts › listCategories › [SWHR-C-0156] …`                                | category with no zh_CN details omitted (in-test fixture)       |
| SWHR-C-0157 | `queries.test.ts › listCategories › [SWHR-C-0157] …`                                | categories ordered by localized name                           |
| SWHR-C-0158 | `queries.test.ts › listProducts › [SWHR-C-0158] …`                                  | DOGS products ordered by localized name                        |
| SWHR-C-0159 | `queries.test.ts › listProducts › [SWHR-C-0159] …`                                  | unknown category → empty page, no error                        |
| SWHR-C-0160 | `queries.test.ts › listItems › [SWHR-C-0160] …`                                     | items carry correct productId/categoryId (D4)                  |
| SWHR-C-0161 | `queries.test.ts › getItem › [SWHR-C-0161] …`                                       | `getItem` returns all display fields                           |
| SWHR-C-0162 | `queries.test.ts › getItem › [SWHR-C-0162] …`                                       | missing-locale lookup → null, no error (see `## Notes`)        |
| SWHR-C-0163 | `queries.test.ts › parseKeywords › [SWHR-C-0163] …`                                 | duplicate keywords collapse                                    |
| SWHR-C-0164 | `queries.test.ts › searchItems › [SWHR-C-0164] …`                                   | blank query → empty page, no navigation                        |
| SWHR-C-0165 | `queries.test.ts › searchItems › [SWHR-C-0165] …`                                   | any-keyword OR match                                           |
| SWHR-C-0166 | `queries.test.ts › searchItems › [SWHR-C-0166] …`                                   | case-insensitive match                                         |
| SWHR-C-0167 | `queries.test.ts › searchItems › [SWHR-C-0167] …`                                   | category-id match, locale-filtered (in-test fixture)           |
| SWHR-C-0168 | `queries.test.ts › listItems › paging › [SWHR-C-0168] …`                            | middle page (in-test 5-item fixture)                           |
| SWHR-C-0169 | `queries.test.ts › listItems › paging › [SWHR-C-0169] …`                            | last page                                                      |
| SWHR-C-0170 | `queries.test.ts › listItems › paging › [SWHR-C-0170] …`                            | start beyond last result                                       |
| SWHR-C-0171 | `paging.test.ts › buildPage › [SWHR-C-0171] …`                                      | previous-page start (unit)                                     |
| SWHR-C-0172 | `paging.test.ts › buildPage › [SWHR-C-0172] …`                                      | no previous page at start 0 (unit)                             |

## Runs

- Red run `91f06843-9cbd-423e-bf2e-b61f4d3647a0` (`a2a_run_tests(phase: "red")`, commit `9c1d441`, after an
  earlier attempt at `79e22e5` was rejected as non-additive — see `## Notes`): **invalid**, one case.
  19 of the 20 cases report `stub_failure` or `assertion_failure` (SWHR-C-0161 fails on assertion because
  the unmodified `getItem` doesn't yet return `categoryId`/`productName`/`attributes`). SWHR-C-0162 reports
  `pass`: disputed, see `## Notes`.
- Green run `6b11be91-874a-41f7-a99e-ea2b61c186c3` (`a2a_run_tests(phase: "green")`, commit `9ee1e56`):
  all 20 cases report `pass`, `modified_after_red: []`. Overall verdict `invalid`, but every reason named
  is a stub-sentinel match in unrelated pre-existing artifact files from other tickets (`.vortex/config.yaml`,
  `artifacts/SWHR-S-0003/SWHR-T-0028..0033`, `artifacts/SWHR-S-0004/SWHR-T-0042..0047`,
  `artifacts/SWHR-S-0005/SWHR-T-0061`) — prose that quotes the sentinel string while documenting the TDD
  convention, not an unreplaced stub in anything this ticket owns (`lib/catalog/{queries,paging,errors}.ts`).
  This is the same platform defect filed as SWHR-T-0065 during SWHR-T-0057; it recurs here because the
  scanner is whole-repo, not ticket-scoped, and more such docs have accumulated since.

## Notes

**Red commit had to be redone once.** The first attempt (`79e22e5`) modified `getItem`, `listProductItems`
and `errors.ts`'s `toCatalogError` in place (replacing their real bodies with stubs) rather than purely
adding new stub declarations, and the platform's red gate correctly rejected it: "may only ADD stubs that
throw the sentinel." Fixed at `9c1d441` by restoring `getProduct`/`getItem`/`listProductItems` and the
original `ItemView`/`ProductView` interfaces byte-for-byte to their pre-ticket state, and appending the
new exports (`CategoryView`, `listCategories`, `getCategory`, `listProducts`, `listItems`, `parseKeywords`,
`searchItems`) as pure additions with stub bodies.

**SWHR-C-0162 disputed.** `getItem("EST-15", "ja_JP")` already returns `null` under the unmodified,
pre-ticket `getItem` — the inner join against `itemDetails` on locale already excludes a missing-locale
row (EST-15 has no ja_JP `itemDetails`, seeded by SWHR-T-0061), the same mechanism the pre-existing
`"[AC-4] returns null for an item whose product lacks the requested locale"` test already proves. A valid
red for this specific case is not obtainable without deliberately regressing that already-shipped,
unrelated behavior. Disputed via `a2a_dispute_test_case` (dispute `08ccfb70`) rather than gaming the gate;
the platform's own reply confirmed this project does not block on the outcome: "This project does not
enforce red or green runs, so the ticket is not blocked: finish it, and record the runs you can." The test
is written, cites the case, and passes either way.

All 540 tests pass (115 files): `bun run verify` — lint, typecheck, and the complete unit suite, green.
`bun run verify:full`'s E2E preflight reports Chromium genuinely not installed in this container; per
AGENTS.md this is the documented fallback (E2E runs in the QA/CI containers), not retried.
