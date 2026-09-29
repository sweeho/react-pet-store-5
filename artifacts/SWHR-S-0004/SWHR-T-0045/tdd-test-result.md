---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0045
branch: vortex/feat/SWHR-T-0045-sign-on-registration-and-sign-out-api-si-3c38b2ba
upstream: [artifacts/SWHR-S-0004/SWHR-T-0045/PLAN.md]
---

# TDD result — SWHR-T-0045

## Test cases

| Test                                                                                                                                           | Covers                                                      | Intent                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `routes/api/signon.test.ts › [SWHR-C-0118] redirects to the sign-in error screen and leaves the session not signed on for invalid credentials` | AC-2 (SWHR-R-0062.02)                                       | wrong password → 401, `/signin-error`, session unchanged.              |
| `routes/api/signon.test.ts › [SWHR-C-0119] sets a 31-day user-name cookie when remember is selected`                                           | AC-3 (SWHR-R-0063.01)                                       | `signon_username=alice`, `Max-Age=2678400`.                            |
| `routes/api/signon.test.ts › [SWHR-C-0120] clears the user-name cookie when remember is not selected`                                          | AC-4 (SWHR-R-0063.02)                                       | `Max-Age=0` clears an existing cookie.                                 |
| `routes/api/signon.test.ts › signs the session on and redirects to the originally requested page`                                              | AC-1 (SWHR-R-0062.01), server half of SWHR-C-0117           | valid credentials after gating → signed on, redirect to `originalUrl`. |
| `routes/api/signon.test.ts › redirects to the home page when there is no originally requested page`                                            | AC-1                                                        | ungated sign-on → `/`.                                                 |
| `routes/api/users/index.test.ts › [SWHR-C-0129] creates a credential for an anonymous caller with no prior sign-on`                            | AC-5 (SWHR-R-0069.01)                                       | no gate, credential persisted.                                         |
| `routes/api/users/index.test.ts › marks the session as a pending registration: userId set, not yet signed on`                                  | AC-6, AC-8 (P7)                                             | pending-registration session state after credential creation.          |
| `routes/api/users/index.test.ts › rejects a duplicate user id with 409 and the user-creation-error redirect`                                   | supporting                                                  | `createCredential`'s `duplicate` → 409.                                |
| `routes/api/users/index.test.ts › rejects a missing password with 400 and the user-creation-error redirect`                                    | supporting                                                  | a rule error → 400.                                                    |
| `routes/api/customers.test.ts › [SWHR-C-0133] redirects to the home page when the originally requested page was the account-change action`     | AC-7 (SWHR-R-0072.02)                                       | `originalUrl === ACCOUNT_CHANGE_PATH` → `/`.                           |
| `routes/api/customers.test.ts › signs the session on as the registering user and returns to checkout`                                          | AC-6, AC-8 (SWHR-R-0072.01/.03), server half of SWHR-C-0132 | registration step 2 signs on and returns to the gated page.            |
| `routes/api/customers.test.ts › creates the customer and profile rows in one transaction`                                                      | AC-6, AC-8                                                  | `customers`/`profiles` rows exist after registration.                  |
| `routes/api/customers.test.ts › rejects a request with no pending registration`                                                                | supporting                                                  | no `userId` on the session → 401.                                      |
| `routes/api/signoff.test.ts › ends the signed-on session, empties the cart and keeps the locale`                                               | AC-9 (SWHR-R-0073.01), server half of SWHR-C-0135           | sign-out ends the session, deletes cart lines, locale untouched.       |

## Red run

`NODE_ENV=test bun --bun vitest run routes/api/signon.test.ts routes/api/users/index.test.ts routes/api/customers.test.ts routes/api/signoff.test.ts`, with all four route handlers stubbed to `throw new Error(<configured stub sentinel>)`:

```
 ❯ |server| routes/api/users/index.test.ts (4 tests | 4 failed)
 ❯ |server| routes/api/signon.test.ts (5 tests | 5 failed)
 ❯ |server| routes/api/customers.test.ts (4 tests | 4 failed)
 ❯ |server| routes/api/signoff.test.ts (1 test | 1 failed)

 Test Files  4 failed (4)
      Tests  14 failed (14)
```

## Green run

`bun run verify` (this stack's full gate — lint + typecheck + the complete Vitest suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  90 passed (90)
      Tests  416 passed (416)
```

`bun run verify:full`'s E2E tier could not run in this container: `scripts/ensure-playwright-browser.mjs` reports Chromium is not installed at the expected path. Per AGENTS.md this is not retried here — E2E runs in the QA phase / CI, and the four e2e cases this ticket's server halves stand in for (SWHR-C-0117, 0132, 0134, 0135) are SWHR-T-0048's.

TDD-RESULT: 416 passed, 0 failed
