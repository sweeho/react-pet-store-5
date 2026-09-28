---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0004
ticket: SWHR-T-0044
idea: SWHR-I-0005
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md,
    openspec/changes/swhr-i-0005-sign-on-and-access-control/specs/sign-on/spec.md,
  ]
---

# PLAN — SWHR-T-0044 · Sessions and the protected-page gate

Change `swhr-i-0005-sign-on-and-access-control` · tasks.md group 3. Read `openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md` first: §Planning (findings, P1–P14, SD-1–SD-8) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0005-sign-on-and-access-control/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (P14).

## Objective

Every request has a per-realm session that ends after its idle limit. Exactly the configured storefront pages are gated, and the page asked for is remembered. Catalog, search and cart, including a minimal add-and-list cart, stay open to anonymous shoppers.

## Steps

1. `lib/auth/session.ts` (P4, §Interface contracts). The realm ids live in the existing sealed cookie. Export the password helper from `lib/locale/session.ts` and change nothing else there. An idle row is replaced with a fresh anonymous row. Ending a session deletes the row and its cart lines.
2. `configs/signon-config.json` and `lib/auth/protection.ts` (P5, P6): the loader keeps the first duplicate name and warns, matching is exact and ignores the query, `checkGate` records `originalUrl`, roles are ignored, and `requireSignOn` is added.
3. `middleware/signon.ts`: gate non-`/api` document requests (P6). Add `middleware/**/*.test.ts` to Vitest's `server` project and exclude it from `client` (P14).
4. `GET /api/session`, `GET /api/signon/config` and `GET /api/signon/gate` (§HTTP surface).
5. `src/components/auth/SignOnGate.tsx`, mounted in `src/main.tsx` around the routes (P6). For a protected path, render nothing until the gate answers; a refused path goes to the returned redirect. Unprotected paths render with no request.
6. `lib/cart/lines.ts`, `GET /api/cart` and `POST /api/cart/items` (P9). The cart routes never call the gate.
7. Write test cases SWHR-C-0121 to SWHR-C-0128, 0136 and 0137 (idle, with a fake clock). SWHR-C-0130 is an e2e case owned by SWHR-T-0048; here, add an API-level test that `POST /api/cart/items` succeeds for an anonymous session.

## File/module ownership

- `lib/auth/session.ts`, `lib/auth/protection.ts`, `lib/cart/lines.ts` and their tests (new); `lib/locale/session.ts` (the password helper export only)
- `configs/signon-config.json` (new)
- `middleware/signon.ts` and its test (new); `vitest.config.ts` (the `middleware` include and exclude only)
- `routes/api/session.get.ts`, `routes/api/signon/config.get.ts`, `routes/api/signon/gate.get.ts`, `routes/api/cart/index.get.ts`, `routes/api/cart/items.post.ts` and their tests (new)
- `src/components/auth/SignOnGate.tsx` and its test (new); `src/main.tsx` (mounting the gate only)

## Definition of Done

- AC-1 … AC-10, in the ticket's order.

## Design reference

No new screen. The gate shows `/signin`, which SWHR-T-0046 builds from `artifacts/SWHR-S-0004/design/mockup-sign-in-remembered-user-name.html`.
