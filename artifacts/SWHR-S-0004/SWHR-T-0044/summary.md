---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0044
branch: vortex/feat/SWHR-T-0044-sessions-and-the-protected-page-gate-rea-88827360
upstream: [artifacts/SWHR-S-0004/SWHR-T-0044/PLAN.md]
downstream: [artifacts/SWHR-S-0004/qa-test-report.md]
---

# Summary — SWHR-T-0044: Sessions and the protected-page gate

## What changed

Added per-realm server-side sessions with idle timeouts, a single `checkGate`/`requireSignOn` gate
used by the SPA, Nitro middleware and API routes, a JSON-driven protection config, and the anonymous
cart seam (`GET /api/cart`, `POST /api/cart/items`). No visible screen changes — the sign-in page
itself is SWHR-T-0046's; this ticket only wires the gate that will send anonymous shoppers to it.

## Files

- `lib/locale/session.ts` — exported the existing password helper as `sessionPassword` so the realm
  session cookie can be sealed with the same password (only change here, per PLAN.md ownership).
- `lib/auth/session.ts` (new) — `getAuthSession`/`findAuthSessionById`/`updateAuthSession`/
  `endAuthSession`, `IDLE_TIMEOUT_MS`; realm session ids live in `authSessions` in the existing sealed
  cookie, next to the locale.
- `lib/auth/protection.ts` (new) — `loadProtectionConfig`, `getProtectionConfig`, `isProtectedPath`,
  `checkGate`, `requireSignOn`, `ACCOUNT_CHANGE_PATH`.
- `lib/cart/lines.ts` (new) — `addCartItem`, `listCartLines`, `deleteCartLinesForSession` (used by
  `endAuthSession`), `getCartWithDetails` (merges lines with catalog item details).
- `configs/signon-config.json` (new) — storefront protected pages (`/account`, `/account-edit`,
  `/checkout`, `/signon-welcome`), sign-on and sign-on-error pages.
- `middleware/signon.ts` (new) — gates non-`/api` document requests; skips `/api` and asset requests.
- `routes/api/session.get.ts`, `routes/api/signon/config.get.ts`, `routes/api/signon/gate.get.ts`,
  `routes/api/cart/index.get.ts`, `routes/api/cart/items.post.ts` (new, each with a `.test.ts`).
- `src/components/auth/SignOnGate.tsx` (new) — the SPA half of the gate: fetches the protected-path
  list once, calls `GET /api/signon/gate` only for a listed path, redirects on refusal.
- `src/main.tsx` — mounts `SignOnGate` around `useRoutes(routes)`.
- `vitest.config.ts` — added `middleware/**/*.test.ts` to the `server` project and excluded it from
  `client` (PLAN.md step 3 / design.md P14).

## AC coverage

- AC-1 (anonymous checkout → sign-in) — `middleware/signon.ts` + `lib/auth/protection.ts:checkGate`,
  `middleware/signon.test.ts › [SWHR-C-0121]`.
- AC-2 (anonymous cart served) — same gate, `middleware/signon.test.ts › [SWHR-C-0122]`.
- AC-3 (signed-on request served directly) — `middleware/signon.test.ts › [SWHR-C-0123]`.
- AC-4 (gated request remembered) — `checkGate` records `originalUrl`,
  `middleware/signon.test.ts › [SWHR-C-0124]`.
- AC-5 (query string ignored) — `isProtectedPath` splits on `?`,
  `middleware/signon.test.ts › [SWHR-C-0125]` and `lib/auth/protection.test.ts › [SWHR-C-0125]`.
- AC-6 (prefix path not matched) — `isProtectedPath` uses exact equality,
  `middleware/signon.test.ts › [SWHR-C-0126]` and `lib/auth/protection.test.ts › [SWHR-C-0126]`.
- AC-7 (duplicate protected-page name) — `loadProtectionConfig`,
  `lib/auth/protection.test.ts › [SWHR-C-0127]`.
- AC-8 (roles ignored) — `checkGate` never reads `roles`,
  `lib/auth/protection.test.ts › [SWHR-C-0128]`.
- AC-9 (anonymous add-to-cart, no gate) — `routes/api/cart/items.post.ts` never calls the gate,
  `routes/api/cart/items.test.ts › adds an item for an anonymous session with no sign-on requested`
  (API-level complement to the e2e case SWHR-C-0130, owned by SWHR-T-0048).
- AC-10 (15-minute idle timeout) — `IDLE_TIMEOUT_MS`/`isIdleExpired` in `lib/auth/session.ts`,
  `middleware/signon.test.ts › [SWHR-C-0136]` (ends at 16 min) and `› [SWHR-C-0137]` (still alive at
  14 min).

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  84 passed (84)
     Tests  379 passed (379)
```

See `tdd-test-result.md` for the red→green proof — `TDD-RESULT: 379 passed, 0 failed`.

`bun run verify:full` (adds Playwright E2E) could not run: this container has no Chromium installed
at the pinned path. Per AGENTS.md this is the expected fallback — E2E runs in the QA phase / CI, not
here — so E2E was not retried and no browser was installed.

Manual browser verification of the gate (`bun run dev` + curl against `/checkout`, `/cart`,
`/api/locale`) was attempted but blocked by a pre-existing, ticket-unrelated environment issue: any
request that reaches `db/client.ts` (its `bun:sqlite` import) 500s under this container's dev server,
reproduced on the unmodified base branch against the pre-existing `/api/locale` route. Filed as a
follow-up (see below). Verification instead relies on the real-`H3Event` integration tests above,
which exercise the actual middleware and route handlers exactly as Nitro invokes them.

CI (which does have Chromium) caught a real regression this local `verify` gate could not see: the
pre-existing `e2e/language-switch.spec.ts › [SWHR-R-0013.01]` navigated anonymously to
`/account?locale=zh_CN` expecting the Account page's own heading — now impossible, since `/account`
is deliberately gated by this ticket (AC-3/AC-4, SWHR-R-0064/0065). Fixed by repointing that case at
`/cart` (still open, same locale-override behaviour under test), commit `2b61c19`. CI is green on the
branch after that fix.

## Notes

- Minor deviation from PLAN.md step 6's wording ("`GET /api/cart` lists lines with item details"):
  `POST /api/cart/items` also returns the merged `{ lines }` shape (matching the §HTTP surface table,
  which lists the same result for both routes) rather than only `{ ok: true }`, via a shared
  `getCartWithDetails` helper added to `lib/cart/lines.ts` beyond the fixed interface (additive per
  the deviation protocol — no fixed contract or ownership changed).
- `getProtectionConfig()` re-reads `configs/signon-config.json` on every call (no caching), matching
  the existing `lib/b2b/config.ts` convention for deployment-level config that changes only between
  deployments.
