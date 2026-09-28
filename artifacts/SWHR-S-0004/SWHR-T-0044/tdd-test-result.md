---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0044
branch: vortex/feat/SWHR-T-0044-sessions-and-the-protected-page-gate-rea-88827360
upstream: [artifacts/SWHR-S-0004/SWHR-T-0044/PLAN.md]
---

# TDD result — SWHR-T-0044

## Test cases

| Test                                                                                                                             | Covers | Intent                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| `middleware/signon.test.ts › [SWHR-C-0121] gates an anonymous request for the checkout entry page`                               | AC-1   | anonymous checkout request is redirected to the sign-in page                                          |
| `middleware/signon.test.ts › [SWHR-C-0122] serves the cart page to an anonymous shopper with no gate`                            | AC-2   | cart is never gated                                                                                   |
| `middleware/signon.test.ts › [SWHR-C-0123] serves a protected page directly to a signed-on session`                              | AC-3   | signed-on session bypasses the gate                                                                   |
| `middleware/signon.test.ts › [SWHR-C-0124] records the gated page as the return target for an anonymous session`                 | AC-4   | gated request's path is recorded as `originalUrl`                                                     |
| `middleware/signon.test.ts › [SWHR-C-0125] gates the account page even with a query string appended`                             | AC-5   | query string does not affect matching                                                                 |
| `lib/auth/protection.test.ts › [SWHR-C-0125] matches regardless of a trailing query string`                                      | AC-5   | `isProtectedPath` unit-level coverage of the same rule                                                |
| `middleware/signon.test.ts › [SWHR-C-0126] does not gate a path that only starts with a protected page's name`                   | AC-6   | `/accountinfo` is not matched by a `/account` entry                                                   |
| `lib/auth/protection.test.ts › [SWHR-C-0126] does not match a path that only starts with a protected one`                        | AC-6   | `isProtectedPath` unit-level coverage of the same rule                                                |
| `lib/auth/protection.test.ts › [SWHR-C-0127] keeps the first path for a duplicate name and logs a warning`                       | AC-7   | `loadProtectionConfig` dedup + warning                                                                |
| `lib/auth/protection.test.ts › [SWHR-C-0128] serves a protected page to a signed-on shopper regardless of its configured roles`  | AC-8   | `checkGate` never reads `roles`                                                                       |
| `routes/api/cart/items.test.ts › adds an item for an anonymous session with no sign-on requested`                                | AC-9   | API-level complement to e2e case SWHR-C-0130 (owned by SWHR-T-0048); POST /api/cart/items never gates |
| `middleware/signon.test.ts › idle timeout (SWHR-R-0074) › [SWHR-C-0136] ends a session idle beyond 15 minutes and shows sign-in` | AC-10  | idle session is replaced and the next protected request is gated                                      |
| `middleware/signon.test.ts › idle timeout (SWHR-R-0074) › [SWHR-C-0137] keeps a session signed on when idle for 14 minutes`      | AC-10  | boundary check just under the 15-minute limit                                                         |

Supporting (not individually case-tagged) coverage for the same behaviour: `lib/auth/session.test.ts` (per-realm sessions, idle expiry, `findAuthSessionById`, `updateAuthSession`, `endAuthSession` deleting cart lines), `lib/cart/lines.test.ts` (`addCartItem`/`listCartLines`/`getCartWithDetails`), `routes/api/session.test.ts`, `routes/api/signon/config.test.ts`, `routes/api/signon/gate.test.ts`, `routes/api/cart/index.test.ts`, `src/components/auth/SignOnGate.test.tsx` (the SPA half of the gate).

## Red run

Command: `NODE_ENV=test bun --bun vitest run lib/auth lib/cart middleware routes/api/session.test.ts routes/api/signon routes/api/cart src/components/auth`

Run with every new source file (`lib/auth/session.ts`, `lib/auth/protection.ts`, `lib/cart/lines.ts`, `middleware/signon.ts`, the five new route handlers, `src/components/auth/SignOnGate.tsx`) temporarily replaced with a stub of the same exported shape whose functions throw `VortexNotImplemented` (component: renders `null`), tests unchanged — the real red/green comparison for this batch of interdependent new modules.

```
Test Files  10 failed (10)
     Tests  53 failed | 1 passed (54)
```

Representative failures:

```
FAIL |server| lib/auth/session.test.ts > getAuthSession > creates a fresh anonymous session on first use
Error: VortexNotImplemented
 ❯ getAuthSession lib/auth/session.ts:22:3

FAIL |server| middleware/signon.test.ts > signon middleware > [SWHR-C-0121] gates an anonymous request for the checkout entry page
Error: VortexNotImplemented
 ❯ middleware/signon.ts:4:3

FAIL |client| src/components/auth/SignOnGate.test.tsx > SignOnGate > renders an unprotected path immediately and never calls the gate
TestingLibraryElementError: Unable to find an element by: [data-testid="content"]
```

The one pass (`lib/auth/protection.test.ts › exports the account-change path used by customer-account (P5)`) asserts a static exported constant (`ACCOUNT_CHANGE_PATH`) that is identical in the stub and the real module — it does not exercise any unimplemented logic.

Real implementation restored from backup after this run (verified byte-identical to what is committed).

## Green run

Command: `bun run verify` (this stack's full gate — `bun run lint && bun run typecheck && bun run test`, the latter `NODE_ENV=test bun --bun vitest run` for the complete suite).

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ node scripts/ensure-generated-files.mjs
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  84 passed (84)
      Tests  379 passed (379)
```

`bun run verify:full` (adds `bun run test:e2e`) could not run in this container: Chromium is not installed at the pinned path (`ensure-playwright-browser.mjs` fails fast by design). Per AGENTS.md this is the expected fallback case — E2E runs in the QA phase / CI, not here — and E2E was not retried and no browser was installed.

TDD-RESULT: 379 passed, 0 failed
