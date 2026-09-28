---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0004
ticket: SWHR-T-0045
idea: SWHR-I-0005
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md,
    openspec/changes/swhr-i-0005-sign-on-and-access-control/specs/sign-on/spec.md,
  ]
---

# PLAN — SWHR-T-0045 · Sign-on, registration and sign-out API

Change `swhr-i-0005-sign-on-and-access-control` · tasks.md group 4. Read `openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md` first: §Planning (findings, P1–P14, SD-1–SD-8) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0005-sign-on-and-access-control/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (P14).

## Objective

A shopper can sign on and return to the page they asked for, create an account without being signed on, complete registration and land on the right page, and sign out to an empty cart in the same language. Every result is a JSON redirect the SPA follows.

## Steps

1. `POST /api/signon` (P7). Write or clear the `signon_username` cookie (31 days, not HttpOnly) before authenticating. On success, mark the storefront session signed on with the user id, call `applyPreferredLanguageOnSignOn`, and return `originalUrl ?? "/"`. On failure, return 401 with `/signin-error` and leave the session unchanged.
2. `POST /api/users` (P7). It needs no prior sign-on. Map `createCredential`'s errors to 400 (rule) or 409 (`duplicate`) with `/user-creation-error`. On success, set the session's `userId` with `signedOn` false and redirect to `/register`.
3. `POST /api/customers` (P8). It needs a pending registration (401 otherwise). Insert `customers` and `profiles` in one transaction, mark the session signed on, apply the language, and return `originalUrl` or `/` (when it was `ACCOUNT_CHANGE_PATH` or absent).
4. `POST /api/signoff`: call `endAuthSession(event, "storefront")`, which deletes the cart lines, and return `/signed-out`. The locale in the cookie is untouched (P4).
5. Write test cases SWHR-C-0118, 0119, 0120, 0129 and 0133. The e2e cases SWHR-C-0117, 0132, 0134 and 0135 belong to SWHR-T-0048; here, prove their server halves (signed-on state, redirect targets, empty cart and unchanged locale after sign-off) with integration tests.

## File/module ownership

- `routes/api/signon.post.ts`, `routes/api/users/index.post.ts`, `routes/api/customers.post.ts`, `routes/api/signoff.post.ts` and their tests (new)

## Definition of Done

- AC-1 … AC-9, in the ticket's order. AC-6, AC-8 and AC-9 are proven here at the API level and in the browser by SWHR-T-0048.

## Design reference

No screen in this ticket. The redirect targets are the pages drawn in `artifacts/SWHR-S-0004/design/` (see `MANIFEST.md`).
