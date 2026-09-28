---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0045
branch: vortex/feat/SWHR-T-0045-sign-on-registration-and-sign-out-api-si-3c38b2ba
upstream: [artifacts/SWHR-S-0004/SWHR-T-0045/PLAN.md]
downstream: [artifacts/SWHR-S-0004/qa-test-report.md]
---

# Summary — SWHR-T-0045: Sign-on, registration and sign-out API

## What changed

Added the four storefront credential/session routes design.md P7/P8 name: `POST /api/signon` (remember cookie, authenticate, mark the session signed on, redirect to the originally requested page or `/`), `POST /api/users` (anonymous credential creation, no gate, marks a pending registration), `POST /api/customers` (registration step 2 — creates `customers`/`profiles` in one transaction, signs the session on, redirects home when the original page was the account-change action), and `POST /api/signoff` (ends the storefront session via the existing `endAuthSession`, which already deletes cart lines and leaves the locale cookie field untouched).

## Files

- `routes/api/signon.post.ts` (new) — sign-on with the `signon_username` remember cookie.
- `routes/api/users/index.post.ts` (new) — anonymous credential creation; this path was vacated when SWHR-T-0042 deleted the boilerplate `routes/api/users/**`.
- `routes/api/customers.post.ts` (new) — registration step 2.
- `routes/api/signoff.post.ts` (new) — sign-out.
- `routes/api/{signon,customers,signoff}.test.ts`, `routes/api/users/index.test.ts` (new) — integration tests for the above.

## AC coverage

- AC-1 (SWHR-R-0062.01) — `routes/api/signon.post.ts`, covered by `signon.test.ts › signs the session on and redirects to the originally requested page` (server half of e2e SWHR-C-0117, owned by SWHR-T-0048).
- AC-2 (SWHR-R-0062.02) — same file, `› [SWHR-C-0118]`.
- AC-3 (SWHR-R-0063.01) — `› [SWHR-C-0119]`.
- AC-4 (SWHR-R-0063.02) — `› [SWHR-C-0120]`.
- AC-5 (SWHR-R-0069.01) — `routes/api/users/index.post.ts`, `index.test.ts › [SWHR-C-0129]`.
- AC-6 (SWHR-R-0072.01) — `routes/api/customers.post.ts`, `customers.test.ts › signs the session on as the registering user and returns to checkout` (server half of e2e SWHR-C-0132).
- AC-7 (SWHR-R-0072.02) — `customers.test.ts › [SWHR-C-0133]`.
- AC-8 (SWHR-R-0072.03) — the same `POST /api/users` → `POST /api/customers` flow AC-5/AC-6 exercise; no separate test, since the "sign-up chosen on the sign-in screen" scenario is that flow entered from a different screen (a client-side distinction SWHR-T-0046 draws). Full browser proof is e2e SWHR-C-0134 (SWHR-T-0048).
- AC-9 (SWHR-R-0073.01) — `routes/api/signoff.post.ts`, `signoff.test.ts` (server half of e2e SWHR-C-0135).

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  90 passed (90)
     Tests  416 passed (416)
```

`bun run verify:full`'s E2E tier could not run — `scripts/ensure-playwright-browser.mjs` reports Chromium is not installed in this container. Not retried, per AGENTS.md; E2E (SWHR-C-0117, 0132, 0134, 0135) runs in SWHR-T-0048 / CI / QA.

## Notes

- `POST /api/customers`'s `preferredLanguage` defaults to the caller's current session locale (via `getSessionLocale`) when absent or not a parseable locale, rather than rejecting the request — PLAN.md doesn't specify an error path here, and the design's own registration-form description says the field itself "default[s] to the session locale," so the route mirrors that at the API boundary rather than requiring the client to always send it. Not exercised by a dedicated test since it's a fallback, not a distinct requirement.
- No deviation from PLAN.md's ownership or contracts; `routes/api/users/index.post.ts` reuses the path SWHR-T-0042 vacated, as PLAN.md's ownership list names it.
