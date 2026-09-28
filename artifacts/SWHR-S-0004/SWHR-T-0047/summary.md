---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0047
branch: vortex/feat/SWHR-T-0047-administrator-and-supplier-access-role-g-eb2b5b63
upstream: [artifacts/SWHR-S-0004/SWHR-T-0047/PLAN.md]
downstream: [artifacts/SWHR-S-0004/qa-test-report.md]
---

# Summary — SWHR-T-0047: Administrator and supplier access

## What changed

Added `lib/auth/roles.ts` (`hasRole`/`requireRole`, direct or group-based), the staff sign-on/sign-off/session routes and the admin data-service/launch routes, the admin console and both realms' sign-in/login-error/inventory/signed-out pages, and a shared `StaffSignInForm` component. Admin copy lives in `src/i18n/admin/{en,de}.ts`; supplier copy is English literals (design.md P12/SD-5). `src/pages/admin/index.tsx` turned from a "coming soon" placeholder into the real public landing page, and `src/pages/supplier/index.tsx` from a placeholder into the role-gated inventory page.

## Files

- `lib/auth/roles.ts` (new) — `hasRole`, `requireRole`.
- `routes/api/staff/{signon,signoff}.post.ts`, `session.get.ts` (new) — staff sign-on/off, session probe.
- `routes/api/admin/{orders,launch}.get.ts` (new) — the admin data service and the session-bound launch descriptor.
- `src/components/auth/StaffSignInForm.tsx` (new) — shared by both realms' sign-in pages.
- `src/pages/admin/{console,signin,login-error}.tsx` (new), `index.tsx` (rewritten from placeholder) + tests.
- `src/pages/supplier/{signin,login-error,signed-out}.tsx` (new), `index.tsx` (rewritten from placeholder) + tests.
- `src/i18n/admin/{en,de}.ts` — new keys for the landing page, console, access-refused view and sign-in/login-error forms.

## AC coverage

- AC-1 (SWHR-R-0075.01) — `admin/console.tsx`, `console.test.tsx › [SWHR-C-0138]`.
- AC-2 (SWHR-R-0075.02) — same file, `› [SWHR-C-0139]`.
- AC-3 (SWHR-R-0076.01) — `lib/auth/roles.ts`'s group-membership path, `roles.test.ts`; the full sign-in-as-a-group-member browser flow is e2e `SWHR-C-0140` (SWHR-T-0048's, per PLAN.md).
- AC-4 (SWHR-R-0077.01) — `routes/api/staff/signon.post.ts`, `signon.test.ts › [SWHR-C-0141]`; the login-error page's own content/link is `admin/login-error.test.tsx`.
- AC-5 (SWHR-R-0078.01) — `routes/api/staff/signoff.post.ts`, `signoff.test.ts › [SWHR-C-0142]`; the client-side redirect is `console.test.tsx`'s sign-out test.
- AC-6 (SWHR-R-0079.01) — `routes/api/staff/session.test.ts › [SWHR-C-0143]` (idle timeout reuses `getAuthSession`'s existing mechanism from SWHR-T-0044, `IDLE_TIMEOUT_MS.admin` = 54 min).
- AC-7 (SWHR-R-0080.01) — `routes/api/admin/orders.get.ts`, `orders.test.ts › [SWHR-C-0144]`.
- AC-8 (SWHR-R-0081.01) — `routes/api/admin/launch.get.ts`, `launch.test.ts › [SWHR-C-0145]` (the descriptor's session id used via `Authorization: Session <id>` against `/api/admin/orders`, no cookie).
- AC-9 (SWHR-R-0082.01) — `supplier/index.tsx`, `index.test.tsx › [SWHR-C-0146]`.
- AC-10 (SWHR-R-0083.01) — `routes/api/staff/signoff.test.ts › [SWHR-C-0147]`; the signed-out page's link is `supplier/signed-out.test.tsx`.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  111 passed (111)
     Tests  492 passed (492)
```

`bun run verify:full`'s E2E tier could not run — `scripts/ensure-playwright-browser.mjs` reports Chromium is not installed in this container. Not retried, per AGENTS.md; `SWHR-C-0140` (the group-member sign-in-then-console browser flow) runs in SWHR-T-0048 / QA / CI.

## Notes

- The admin/supplier sign-in cards render the mockups' "Staff only" badge and shield icon (`mockup-administrator-sign-in.html` / `mockup-supplier-sign-in.html`), added to `StaffSignInForm` after the first pass to match PLAN.md's DoD line "the staff sign-in and login-error pages match their mockups' content and structure."
- `GET /api/admin/orders` needs only a signed-on admin session, not the role (design.md P11 / PRODUCT.md rule 11) — its own tests confirm a non-administrator session still gets order data, distinct from `GET /api/admin/launch`, which does require the role.
- "Manage orders" on the console calls `GET /api/admin/launch` and shows the returned session id inline; the order-management client itself is out of scope (OQ-6, design.md non-goals).
- No deviation from PLAN.md's ownership or contracts.
