---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0004
ticket: SWHR-T-0043
idea: SWHR-I-0005
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md,
    openspec/changes/swhr-i-0005-sign-on-and-access-control/specs/sign-on/spec.md,
  ]
---

# PLAN — SWHR-T-0043 · Credential rules

Change `swhr-i-0005-sign-on-and-access-control` · tasks.md group 2. Read `openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md` first: §Planning (findings, P1–P14, SD-1–SD-8) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0005-sign-on-and-access-control/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (P14).

## Objective

Credentials are created only when they satisfy the user id and password rules and the user id is unused. Authentication is an exact, case-sensitive match on a hashed password, and it never raises for an unknown user.

## Steps

1. `lib/auth/password.ts`: `hashPassword` and `verifyPassword` over `Bun.password` (P2). The hash must verify the seeds that SWHR-T-0042 wrote with `hashSync`.
2. `lib/auth/credentials.ts`: `validateUserId`, `validatePassword` and `getPasswordMaxLength` (P3, §Interface contracts). Empty values return `"missing"` first.
3. `createCredential`: validate, then insert. A primary-key conflict becomes `"duplicate"`, and nothing is stored on any failure.
4. `authenticate`: an unknown user id returns `false` without throwing. Never log a password or pass one to an error (OQ-2).
5. Write test cases SWHR-C-0107 to SWHR-C-0116 (tasks 7.1), including the 25- and 26-character boundaries, `%` and `*`, and a password one character over the configured maximum.

## File/module ownership

- `lib/auth/password.ts`, `lib/auth/credentials.ts` and their tests (new)

## Definition of Done

- AC-1 … AC-10, in the ticket's order. AC-2 is proven here at the `"duplicate"` result; SWHR-T-0045 and SWHR-T-0046 show the screen.

## Design reference

No screen in this ticket.
