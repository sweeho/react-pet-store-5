---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0034
branch: vortex/feat/SWHR-T-0034-exchange-test-suite-approved-test-case-t-6228bde0
upstream: [artifacts/SWHR-S-0003/SWHR-T-0034/PLAN.md]
---

# TDD result — SWHR-T-0034

## Test cases

This ticket closes the change's test group rather than implementing a new requirement, so its own
tests carry no new `SWHR-C-*` id — they prove AC-1 and AC-2 about the _existing_ 52 approved cases.

| Test                                                                                                                                                         | Covers | Intent                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/b2b/scenarios/coverage.test.ts › every approved SWHR-C-* case in test-cases.md is named by at least one test under lib/b2b`                             | AC-1   | self-checking traceability: every approved id in `test-cases.md` is matched against `it`/`test`/`describe` titles                                       |
| `lib/b2b/scenarios/order-to-invoice.test.ts › delivers two orders through supplier intake and both invoice consumers with matching order ids and quantities` | AC-2   | two orders → `sendSupplierPurchaseOrders` → supplier intake → `shipOnReceipt` → `publishInvoices` → both invoice consumers, draining the outbox to idle |

**Step 1 finding (PLAN.md):** listing `SWHR-C-0047`–`SWHR-C-0098` against every test already written by
SWHR-T-0028–SWHR-T-0033 found **zero gaps** — all 52 approved cases already carry a passing test. This
was verified by diffing the full id list extracted from `test-cases.md` against every `[SWHR-C-*]`
appearing on an `it`/`test`/`describe` line under `lib/` and `routes/` (`comm -23` on the two sorted
lists produced no output). `coverage.test.ts` encodes this same check as a standing test so a future
regression (a renamed or deleted case-carrying test) fails CI rather than going unnoticed.

## Red run

These two tests are new, not a stub-then-implement cycle (there is no application code to stub — this
ticket's job is the test suite itself, and the code it exercises already exists from prior tickets).
The equivalent "red" proof is that each test genuinely fails when the thing it checks is false, run
directly (not as a stub swap):

- `coverage.test.ts`: temporarily pushed a nonexistent id (`SWHR-C-9999`) onto the `approved` list
  before the assertion.
- `order-to-invoice.test.ts`: temporarily changed the expected shipped quantity for `ORD-FLOW-A` from
  `5` to `999`.

```
NODE_ENV=test bun --bun vitest run lib/b2b/scenarios
 Test Files  2 failed (2)
      Tests  2 failed (2)
```

Both failed with the expected assertion mismatch (`coverage.test.ts`: `missing` was `["SWHR-C-9999"]`,
not `[]`; `order-to-invoice.test.ts`: expected shipped quantity `999`, received the real `5`) —
reproduced on this run (a single execution; no flake observed) and confirming neither assertion is a
tautology. Both injected faults were then reverted before committing.

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + the complete unit/integration
suite), with the real test content restored:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run
 Test Files  76 passed (76)
      Tests  328 passed (328)
```

328 = the 326-test baseline on this branch (confirmed via `git stash` before writing this ticket's
files) plus this ticket's 2 new tests — zero new failures, zero regressions. All 52 approved
`SWHR-C-0047`–`SWHR-C-0098` cases pass as part of this run (they are existing tests from prior tickets;
`coverage.test.ts` is the standing proof they are all still present and passing).

`bun run test:e2e` was attempted and its preflight reported Chromium is not installed in this
container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing) — per AGENTS.md this means fall
back to `verify` rather than retry or install a browser. This ticket has no UI; Validation's E2E run at
integration QA covers the existing storefront regression suite unchanged.

TDD-RESULT: 328 passed, 0 failed
