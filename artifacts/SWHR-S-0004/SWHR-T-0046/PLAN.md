---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0004
ticket: SWHR-T-0046
idea: SWHR-I-0005
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md,
    openspec/changes/swhr-i-0005-sign-on-and-access-control/specs/sign-on/spec.md,
  ]
---

# PLAN — SWHR-T-0046 · Storefront screens

Change `swhr-i-0005-sign-on-and-access-control` · tasks.md group 5. Read `openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md` first: §Planning (findings, P1–P14, SD-1–SD-8) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0005-sign-on-and-access-control/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (P14).

## Objective

The storefront shows the sign-in, sign-in error, user-creation error, signed-out, welcome and account-information pages as drawn, and the header switches between Sign in and Sign out. A shopper can add an item to the cart from the product page and see it listed in the cart.

## Steps

1. `src/components/ui/input.tsx` (+ test): the shared text-input primitive with a visible label, helper text and an error message (P13; the DESIGN.md forms pattern). Follow the `button.tsx` component pattern.
2. `src/pages/signin.tsx`: returning-customer form (user name, password, "Remember My User Name", Sign In) beside the new-account form (user name, password, repeat password, Create New Account). Pre-fill the user name and tick the box from the `signon_username` cookie. Otherwise leave every field empty (SD-5). The client-side empty check shows one message per empty field and does not submit. Submit to `POST /api/signon` or `POST /api/users` and navigate to the returned `redirect`.
3. `signin-error.tsx`, `user-creation-error.tsx` and `signed-out.tsx`, using the `ErrorState` frame where the mockup shows a message page, and `signon-welcome.tsx`. `register.tsx` is the account-information form (P8), submitting to `POST /api/customers`.
4. `src/hooks/useSignOnSession.ts` (§Interface contracts), with a provider inside `SiteLayout`. `SiteHeader.tsx` and the mobile panel in `GlobalNav.tsx` show exactly one of Sign in (linking to `/signon-welcome`, SD-6) or Sign out (`POST /api/signoff`, then navigate). Refresh the session state after sign-on, registration and sign-out.
5. Copy for every new storefront page in `src/i18n/screens/*.ts` in en_US, ja_JP and zh_CN. The signed-out page must render in Japanese (`SWHR-R-0073`).
6. Cart seam UI (P9): an Add to Cart control per item on `src/pages/product/[productId].tsx` (`POST /api/cart/items`), and the item list with quantities on `src/pages/cart.tsx` (`GET /api/cart`, through `AsyncContent`).
7. Write test cases SWHR-C-0099 to SWHR-C-0102, 0104 and 0105. The e2e cases SWHR-C-0103 and 0106 belong to SWHR-T-0048.

## File/module ownership

- `src/components/ui/input.tsx` (+ test, + `index.ts` export)
- `src/pages/signin.tsx`, `signin-error.tsx`, `user-creation-error.tsx`, `signed-out.tsx`, `signon-welcome.tsx`, `register.tsx`, `cart.tsx`, `product/[productId].tsx` and their tests
- `src/hooks/useSignOnSession.ts` (+ test); `src/components/layout/SiteLayout.tsx`, `SiteHeader.tsx`, `GlobalNav.tsx` and the layout test
- `src/i18n/screens/{signin,signin-error,user-creation-error,signed-out,signon-welcome,register,shell,cart,product}.ts`

## Definition of Done

- AC-1 … AC-8, in the ticket's order.
- Each new page matches its mockup's content and structure, rendered in the shared shell with existing tokens.

## Design reference

- Sign in: `artifacts/SWHR-S-0004/design/mockup-sign-in-remembered-user-name.html`, `mockup-sign-in-no-remembered-user-name-demo-cre.html` (without the demo pre-fill, SD-5), wireframes `wireframe-sign-in-*.html`
- Sign-in error: `mockup-sign-in-error.html`, `wireframe-sign-in-error.html`
- User creation error: `mockup-user-creation-error.html`, `wireframe-user-creation-error.html`
- Signed out: `mockup-signed-out.html`, `wireframe-signed-out.html`
- There is no mockup for the welcome and account-information pages; build them from the same shell, headings and form pattern.
