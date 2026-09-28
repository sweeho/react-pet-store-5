---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0014
branch: vortex/feat/SWHR-T-0014-session-locale-default-assignment-change-0c44fd69
upstream: [artifacts/SWHR-S-0002/SWHR-T-0014/PLAN.md]
---

# Summary — SWHR-T-0014: Session locale — default assignment, change endpoint, cart locale and server-side access

## What changed

Added a server-authoritative session locale (design D2/P2): `lib/locale/session.ts` wraps h3's sealed-cookie `useSession`, holding `{ locale, cartLocale }`; `middleware/locale.ts` assigns the default locale to a session that has none and sets `event.context.locale` for every handler; `GET`/`POST /api/locale` let the SPA read and change it. A locale change moves both `locale` and `cartLocale` together (P5, the ticket's "also moves the cart locale").

This ticket builds no UI — its `PLAN.md` scopes it to the server seam only; the language-switcher screen and per-page localization are later tickets (SWHR-T-0017/0018/0020) that consume this endpoint.

## Files

- `lib/locale/session.ts` (new) — `getSessionLocale`, `setSessionLocale`, `getCartLocale`, per the ticket's fixed interface contract. The session password comes from `SESSION_PASSWORD`, falling back to a fixed dev-only value outside production (throws if unset in production).
- `lib/locale/session.test.ts` (new) — unit/integration tests against real H3 events and a real sealed-cookie session.
- `middleware/locale.ts` (new) — assigns the default locale when absent, never overwrites an existing one, sets `event.context.locale`.
- `routes/api/locale.get.ts` (new) — returns `{ locale, cartLocale }`.
- `routes/api/locale.post.ts` (new) — validates the requested locale via `parseLocale`; on failure, throws HTTP 400 with `Unable to change language to <input>` and writes nothing; on success, writes both `locale` and `cartLocale`.
- `routes/api/locale.test.ts` (new) — integration tests wiring the middleware and both routes together, following `routes/api/hello.test.ts`'s pattern.

## AC coverage

- AC-1 (Default session locale — new visitor): `lib/locale/session.test.ts` and `routes/api/locale.test.ts`, `[AC-1]` cases.
- AC-2 (Default session locale — existing locale preserved): `[AC-2]` cases in both test files.
- AC-3 (Rejected locale change — unparseable code): `routes/api/locale.test.ts › POST /api/locale › [AC-3]`.
- AC-4 (Locale change reaches server-side business state): `routes/api/locale.test.ts › POST /api/locale › [AC-4]`, asserted via `event.context.locale` — the mechanism D2 names for how business operations read the locale.

## Verification

- Red: `lib/locale/session.test.ts` and `routes/api/locale.test.ts` run against the four implementation files removed — both suites fail on unresolved imports.
- Green: `bun run verify` (lint + `tsc --build` + full unit suite) — 17 test files, 53 tests passed; lint and typecheck clean.
- `bun run verify:full`'s E2E tier was not run: this container has no Chromium installed (`ensure-playwright-browser.mjs` reports it missing). This ticket has no E2E surface (no UI); Validation re-runs the E2E tier at INTEGRATION_QA in a browser-equipped container.

Full detail: `tdd-test-result.md`.

## Notes

- Deviation from `PLAN.md`: none in the interface contract. One implementation detail not specified by the plan — `useSession`'s name collides with React's hook-naming convention, so ESLint's `react-hooks/rules-of-hooks` flags the call inside `lib/locale/session.ts`'s non-hook wrapper. Fixed with a one-line, justified `eslint-disable-next-line` at the call site (this is h3 server-side session code, not a React hook).
