---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0004
ticket: SWHR-T-0047
idea: SWHR-I-0005
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md,
    openspec/changes/swhr-i-0005-sign-on-and-access-control/specs/sign-on/spec.md,
  ]
---

# PLAN — SWHR-T-0047 · Administrator and supplier access

Change `swhr-i-0005-sign-on-and-access-control` · tasks.md group 6. Read `openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md` first: §Planning (findings, P1–P14, SD-1–SD-8) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0005-sign-on-and-access-control/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (P14).

## Objective

The administration console and supplier inventory admit only signed-in users holding the administrator role. Staff sign-in failures, sign-outs and idle timeouts behave as specified. The admin data service refuses a request with no session, and a launch descriptor lets the order client reuse the admin session.

## Steps

1. `lib/auth/roles.ts`: `hasRole` (direct assignment or group membership) and `requireRole` (§Interface contracts, P10).
2. `POST /api/staff/signon`, `POST /api/staff/signoff` and `GET /api/staff/session` (P10). A failed sign-on returns 401 with `/<realm>/login-error`. Admin sign-off redirects to `/admin`; supplier sign-off to `/supplier/signed-out`. Idle staff sessions expire at 54 minutes through `getAuthSession`.
3. `GET /api/admin/orders` (session required, role not required, `Authorization: Session <id>` accepted, the exact timed-out reply otherwise) and `GET /api/admin/launch` (role required) (P11). Orders come from `listSupplierOrders`.
4. Pages (P12): `src/pages/admin/index.tsx` becomes the public landing page with a Sign in link; add `admin/console.tsx` (not signed on → `/admin/signin`; no role → access refused; role → console with Manage orders and Sign out), `admin/signin.tsx` and `admin/login-error.tsx`. `src/pages/supplier/index.tsx` becomes the inventory page (not signed on → `/supplier/signin`; no role → "not authorised to update orders" and no form); add `supplier/signin.tsx`, `supplier/login-error.tsx` and `supplier/signed-out.tsx`. One shared staff sign-in form component serves both realms, built on the input primitive from SWHR-T-0046, and is never pre-filled.
5. Admin copy is added to `src/i18n/admin/{en,de,types}.ts`. Supplier copy is English literals.
6. Write test cases SWHR-C-0138, 0139 and 0141 to 0147. The e2e case SWHR-C-0140 belongs to SWHR-T-0048.

## File/module ownership

- `lib/auth/roles.ts` (+ test)
- `routes/api/staff/signon.post.ts`, `signoff.post.ts`, `session.get.ts`, `routes/api/admin/orders.get.ts`, `launch.get.ts` and their tests (new)
- `src/pages/admin/**`, `src/pages/supplier/**` and their tests; `src/components/auth/StaffSignInForm.tsx` (+ test, new)
- `src/i18n/admin/{en,de,types}.ts`

## Definition of Done

- AC-1 … AC-10, in the ticket's order.
- The staff sign-in and login-error pages match their mockups' content and structure.

## Design reference

- Administrator sign-in: `artifacts/SWHR-S-0004/design/mockup-administrator-sign-in.html`, `wireframe-administrator-sign-in.html`
- Administrator login error: `mockup-administrator-sign-in-error.html`, `wireframe-administrator-sign-in-error.html`
- Supplier sign-in: `mockup-supplier-sign-in.html`, `wireframe-supplier-sign-in.html`
- Supplier login error: `mockup-supplier-sign-in-error.html`, `wireframe-supplier-sign-in-error.html`
- There is no mockup for the admin landing page, the console, the access-refused view, the supplier inventory gate or the supplier signed-out page; build them from the shell and the `EmptyState` and `ErrorState` frames.
