---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0003
idea: SWHR-I-0004
branch: vortex/sprint/swhr-s-0003-6b5b7d75
upstream: [artifacts/SWHR-S-0003/SPRINT-PLAN.md]
downstream: [artifacts/SWHR-S-0003/sprint-summary.md]
---

# QA test report — SWHR-S-0003

## Executive Summary

**Verdict: PASS.** SWHR-I-0004 (Partner document exchange) is verified against the integrated
sprint branch. All 7 committed tickets (SWHR-T-0028–SWHR-T-0034) are merged. `bun run verify`
(lint + typecheck + unit) is green at 328/328 tests across 76 files; the storefront E2E regression
suite is green at 28/28 with zero skips. All 52 scenarios in the change's delta spec
(`openspec/changes/swhr-i-0004-partner-document-exchange/specs/b2b-document-exchange/spec.md`) were
walked against their approved test cases and verified pass — see `## Issues Found` for the full
list. No defects were found; `integration-defects-resolution.md` records an empty defect log.

## E2E Test Status

SWHR-I-0004 has no screens (confirmed in `SPRINT-PLAN.md`'s "User interface" section and its Phase
table), so it adds no Playwright specs of its own. The existing storefront regression suite
(6 spec files, 28 tests) was run against the integrated build to confirm no regression: **28
passed, 0 failed, 0 skipped**. Full command, per-spec table and the `E2E-RESULT:` marker are in
`artifacts/SWHR-S-0003/integration-test-result.md`.

## Unit Test Results

```
$ bun install
$ bun run build
✓ built in 242ms / [nitro] ✔ Generated public .output/public

$ bun run verify
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0   (no output — clean)
$ tsc --build   (no output — clean)
$ NODE_ENV=test bun --bun vitest run
 Test Files  76 passed (76)
      Tests  328 passed (328)
   Duration  5.70s
```

Baseline before this sprint (per SWHR-T-0034's `summary.md`) was also 328 passing at that ticket's
merge — this change's own test group (group 7) added no new case-carrying tests because its
coverage audit (`lib/b2b/scenarios/coverage.test.ts`) found zero gaps against the 52 approved cases;
it added only the self-checking coverage test and one cross-module end-to-end flow test
(`lib/b2b/scenarios/order-to-invoice.test.ts`), both counted in the 328.

## Code Review

Reviewed incidentally while verifying, not as a line-by-line audit:

- `lib/b2b/config.ts` reads `process.env` directly per call (no caching) with a documented
  rationale (deployment-scoped, not request-scoped) — appropriate for its use.
- The outbox/dispatcher mechanism (`lib/messaging/`) matches the decision recorded in
  `ARCHITECTURE.md`'s Key Decisions ("One outbox for every asynchronous hop... Authored in change
  `swhr-i-0004-partner-document-exchange` (design P4, P5)"), so the cross-ticket contract held.
- Each ticket's `summary.md` documents its own deviations and cross-ticket fixes transparently
  (e.g. SWHR-T-0030 fixing a pre-existing test-isolation bug in SWHR-T-0028's schema-file test;
  SWHR-T-0033 adding `plugins/**` to `vitest.config.ts`'s server project because the outbox
  dispatcher plugin test needs `bun:sqlite`). Both are narrow, justified, and covered by passing
  tests.
- `design.md`'s Risks/Trade-offs (R1–R11) and Spec discrepancies (SD-1–SD-9) are carried
  transparently rather than silently resolved; SD-6 (version 1.0 element names reconstructed, low
  confidence) and R10 (whether 1.0 support is still needed) are flagged for a human ruling
  (SWHR-T-0035) rather than assumed.

No notable concerns found.

## Coverage Summary

No coverage tool is configured in this project (`@vitest/coverage-v8` is not installed, and
`vitest.config.ts`/`package.json` define no coverage script) — installing one is outside this
ticket's scope. In its place, `lib/b2b/scenarios/coverage.test.ts` is a standing, self-checking
assertion that every approved test case (`SWHR-C-0047`–`SWHR-C-0098`, all 52 scenarios in this
change's delta spec) is named by at least one test under `lib/b2b`; it passed as part of the
328-test run above. Combined with the scenario walk in `## Issues Found`, this is the coverage
evidence available for this sprint.

## Issues Found

None. Every scenario below verified pass against its approved test case
(`openspec/changes/swhr-i-0004-partner-document-exchange/test-cases.md`), itself part of the
328-passing `bun run test` run. `integration-defects-resolution.md` records the empty defect log
(`INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`).

SCENARIO-VERDICT: Purchase order document structure / Purchase order written with two line items — pass (SWHR-C-0047)
SCENARIO-VERDICT: Purchase order document structure / Purchase order without a locale attribute — pass (SWHR-C-0048)
SCENARIO-VERDICT: Purchase order document structure / Purchase order with no line items — pass (SWHR-C-0049)
SCENARIO-VERDICT: Purchase order document root check / Wrong root element — pass (SWHR-C-0050)
SCENARIO-VERDICT: Purchase order date handling / Order date written — pass (SWHR-C-0051)
SCENARIO-VERDICT: Purchase order date handling / Unparseable order date — pass (SWHR-C-0052)
SCENARIO-VERDICT: Contact information element / Empty email accepted — pass (SWHR-C-0053)
SCENARIO-VERDICT: Contact information element / Empty phone rejected — pass (SWHR-C-0054)
SCENARIO-VERDICT: Contact information element / Elements out of order — pass (SWHR-C-0055)
SCENARIO-VERDICT: Address element output / No second street line — pass (SWHR-C-0056)
SCENARIO-VERDICT: Address element output / Missing state — pass (SWHR-C-0057)
SCENARIO-VERDICT: Address element input / Empty city — pass (SWHR-C-0058)
SCENARIO-VERDICT: Address element input / Missing country — pass (SWHR-C-0059)
SCENARIO-VERDICT: Address element input / Present but empty second street line — pass (SWHR-C-0060)
SCENARIO-VERDICT: Credit card element / Credit card round trip — pass (SWHR-C-0061)
SCENARIO-VERDICT: Credit card element / Wrong element offered as a card — pass (SWHR-C-0062)
SCENARIO-VERDICT: Order line item element / Non-numeric quantity — pass (SWHR-C-0063)
SCENARIO-VERDICT: Order line item element / Missing unit price — pass (SWHR-C-0064)
SCENARIO-VERDICT: Line item export excludes shipped quantity / Partly shipped line exported — pass (SWHR-C-0065)
SCENARIO-VERDICT: Internal supplier order document / Wrong root element — pass (SWHR-C-0066)
SCENARIO-VERDICT: Internal supplier order document / Supplier order written — pass (SWHR-C-0067)
SCENARIO-VERDICT: Internal supplier order date handling / Unparseable supplier order date — pass (SWHR-C-0068)
SCENARIO-VERDICT: Partner supplier order document / Partner order built for an approved order — pass (SWHR-C-0069)
SCENARIO-VERDICT: Partner supplier order document / Second street line not transmitted — pass (SWHR-C-0070)
SCENARIO-VERDICT: Partner supplier order intake / Partner-format order received — pass (SWHR-C-0071)
SCENARIO-VERDICT: Partner supplier order intake / Internal-format order received — pass (SWHR-C-0072)
SCENARIO-VERDICT: Partner invoice document / Invoice for a shipment — pass (SWHR-C-0073)
SCENARIO-VERDICT: Partner invoice intake / Valid invoice received — pass (SWHR-C-0074)
SCENARIO-VERDICT: Partner invoice intake / Wrong document on the invoice channel — pass (SWHR-C-0075)
SCENARIO-VERDICT: Partner line item values / Zero unit price — pass (SWHR-C-0076)
SCENARIO-VERDICT: Partner line item values / Zero quantity — pass (SWHR-C-0077)
SCENARIO-VERDICT: Unique item per partner document / Duplicate item id — pass (SWHR-C-0078)
SCENARIO-VERDICT: Partner document dates / Shipping date written — pass (SWHR-C-0079)
SCENARIO-VERDICT: Required document values / Missing user id — pass (SWHR-C-0080)
SCENARIO-VERDICT: Required document values / Empty string value — pass (SWHR-C-0081)
SCENARIO-VERDICT: Document encoding / Non-ASCII name — pass (SWHR-C-0082)
SCENARIO-VERDICT: Configurable document validation / Invoice validation switched off — pass (SWHR-C-0083)
SCENARIO-VERDICT: Configurable document validation / Schema form selected — pass (SWHR-C-0084)
SCENARIO-VERDICT: Document type check / Mismatched document type — pass (SWHR-C-0085)
SCENARIO-VERDICT: Document type check / No document type declared — pass (SWHR-C-0086)
SCENARIO-VERDICT: Malformed and invalid document handling / Malformed document — pass (SWHR-C-0087)
SCENARIO-VERDICT: Malformed and invalid document handling / Schema violation — pass (SWHR-C-0088)
SCENARIO-VERDICT: Supplier order document validation / Invalid supplier order with validation enabled — pass (SWHR-C-0089)
SCENARIO-VERDICT: Supplier order document validation / Validation disabled by deployment — pass (SWHR-C-0090)
SCENARIO-VERDICT: Schema resolution / Deployment catalog overrides bundled mapping — pass (SWHR-C-0091)
SCENARIO-VERDICT: Schema resolution / Unmapped identifier — pass (SWHR-C-0092)
SCENARIO-VERDICT: Asynchronous partner exchange / Approval yields supplier messages — pass (SWHR-C-0093)
SCENARIO-VERDICT: Asynchronous partner exchange / Invoice fan-out — pass (SWHR-C-0094)
SCENARIO-VERDICT: Supplier order intake is atomic / Invoice publication fails — pass (SWHR-C-0095)
SCENARIO-VERDICT: Supplier order intake is atomic / Malformed order message — pass (SWHR-C-0096)
SCENARIO-VERDICT: Supplier invoice publication / Stock arrival ships pending orders — pass (SWHR-C-0097)
SCENARIO-VERDICT: Legacy version 1.0 document formats / Version 1.0 purchase order received — pass (SWHR-C-0098)

## Recommendation

**Proceed.** Fire `validation.all_acs_passed` — every scenario the sprint promised holds, no
defects were found, and E2E shows no regression.
