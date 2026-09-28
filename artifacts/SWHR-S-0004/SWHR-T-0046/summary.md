---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0046
branch: vortex/feat/SWHR-T-0046-storefront-screens-sign-in-sign-in-error-84b1d3d7
upstream: [artifacts/SWHR-S-0004/SWHR-T-0046/PLAN.md]
downstream: [artifacts/SWHR-S-0004/qa-test-report.md]
---

# Summary — SWHR-T-0046: Storefront screens

## What changed

Built the sign-in/sign-in-error/user-creation-error/signed-out/welcome/registration screens, the
shared `Input` primitive, the client-side `useSignOnSession` seam, header Sign-in/Sign-out state
(SD-6), and the cart seam UI (Add to Cart + `/cart` listing), matching the mockups where one
exists (sign-in, sign-in-error, user-creation-error, signed-out) and the shared shell/form pattern
where none does (welcome, register, per PLAN.md).

## Files

- `src/components/ui/input.tsx` (+test, +export) — the shared label/helper/error text field.
- `src/hooks/useSignOnSession.tsx` (+test, +export) — loads `GET /api/session`, exposes
  `{signedOn, userId, refresh}`; `.tsx` not `.ts` (deviation — see Notes).
- `src/components/state/ErrorState.tsx` (+test) — additive `primaryAction`/`secondaryLabel` props
  so a message page can link back to a form instead of retrying (DESIGN.md §Forms).
- `src/components/layout/SiteLayout.tsx` — wraps the shell in `SignOnSessionProvider`.
- `src/components/layout/SiteHeader.tsx`, `GlobalNav.tsx` (+`SiteLayout.test.tsx`) — desktop and
  mobile-drawer Sign in (→ `/signon-welcome`, SD-6) / Sign out (`POST /api/signoff`).
- `src/pages/signin.tsx` (+test) — returning-customer and new-account forms, cookie-based
  remembered user name, client-side empty-field check, `/api/signon` and `/api/users`.
- `src/pages/signin-error.tsx`, `user-creation-error.tsx`, `signed-out.tsx` (+tests) — `ErrorState`
  message pages.
- `src/pages/signon-welcome.tsx`, `register.tsx` (+tests) — no-mockup seams (design.md P8/SD-6).
- `src/pages/product/[productId].tsx`, `cart.tsx` (+tests) — Add to Cart control, `/cart` listing.
- `src/i18n/screens/{signin,signin-error,user-creation-error,signed-out,signon-welcome,register,
shell,cart,product}.ts` — en_US/ja_JP/zh_CN copy for every page above and the header's new
  `signOut` key.

## AC coverage

- AC-1, AC-2, AC-3, AC-4 (Sign-in screen) — `signin.tsx`, `SWHR-C-0099`..`SWHR-C-0102`.
- AC-5 (Sign-in error screen) — `signin-error.tsx`; unit half only, e2e half (`SWHR-C-0103`) is
  SWHR-T-0048's per PLAN.md.
- AC-6, AC-7 (Storefront page header) — `SiteHeader.tsx`/`GlobalNav.tsx`, `SWHR-C-0104`/`0105`.
- AC-8 (header search for "dog") — pre-existing `handleSearch` in `SiteHeader.tsx`, untouched by
  this ticket; e2e case `SWHR-C-0106` is SWHR-T-0048's.

## Verification

```
$ bun run verify        # lint + typecheck + full suite
Test Files  97 passed (97)
     Tests  445 passed (445)

$ bun run verify:full   # verify + E2E preflight
Playwright Chromium not installed in this container — genuine-absence fallback
(AGENTS.md); verify stands as the green run, E2E not retried.
```

See `tdd-test-result.md` — `TDD-RESULT: 445 passed, 0 failed`, including how red was captured
(implementation files reverted, tests run, then fully restored).

## Notes

- **`useSignOnSession.tsx`, not `.ts`.** design.md's interface-contract header names
  `src/hooks/useSignOnSession.ts`, but the file also exports the `SignOnSessionProvider` component
  (JSX), which a `.ts` file can't contain. Only the extension differs — the export names, the
  `useSignOnSession()` signature and every call site (`@/hooks/useSignOnSession`, extensionless)
  match the contract exactly.
- **`ErrorState`'s `primaryAction`/`secondaryLabel` are additive.** `onRetry` (used by
  `RootErrorBoundary` and `AsyncContent`, both outside this ticket) is unchanged; `primaryAction`
  takes precedence when both are given, and existing callers pass neither.
- **`navigation.ts`'s `PRIMARY_AREAS.SIGNIN` entry (`/signin`) is untouched.** SD-6 only changes the
  _header's_ Sign in link target; `SiteLayout.test.tsx`'s generic "every PRIMARY_AREAS href is
  present" check now excludes `SIGNIN` and asserts the session-dependent Sign in/Sign out state
  directly instead (`SWHR-C-0104`/`0105`). `src/pages/index.tsx` and its test, which link to
  `/signin` from the home page tiles, are unaffected.
