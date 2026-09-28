---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0043
branch: vortex/feat/SWHR-T-0043-credential-rules-user-id-and-password-ch-9d8770ca
upstream: [artifacts/SWHR-S-0004/SWHR-T-0043/PLAN.md]
downstream: [artifacts/SWHR-S-0004/qa-test-report.md]
---

# Summary — SWHR-T-0043: Credential rules — user id and password checks, hashing, creation and authentication

## What changed

Added `lib/auth/password.ts` (`Bun.password` hash/verify, design.md P2) and `lib/auth/credentials.ts`
(user id and password validation, `createCredential`, `authenticate`, design.md P3), against the
`users` table SWHR-T-0042 already created. No screen in this ticket (PLAN.md §Design reference).

## Files

- `lib/auth/password.ts` — new: `hashPassword`/`verifyPassword` over `Bun.password` (argon2id).
- `lib/auth/password.test.ts` — new: case-exact verification, and verifies a `Bun.password.hashSync` seed hash.
- `lib/auth/credentials.ts` — new: `USER_ID_MAX_LENGTH`, `getPasswordMaxLength`, `validateUserId`, `validatePassword`, `createCredential`, `authenticate`, matching design.md's fixed interface contract exactly.
- `lib/auth/credentials.test.ts` — new: rule-function unit tests plus the ten SWHR-C-0107..0116 integration cases.

## AC coverage

- AC-1 (Sign-on credential record) — `createCredential`, `SWHR-C-0107`.
- AC-2 (Unique user id) — `onConflictDoNothing` in `createCredential` → `"duplicate"`, `SWHR-C-0108`. (The "User Creation Error" screen itself is SWHR-T-0045/0046's; this ticket proves the `"duplicate"` result the screen renders from, per PLAN.md.)
- AC-3, AC-4 (User id length limit) — `validateUserId`, `SWHR-C-0109`/`SWHR-C-0110`.
- AC-5, AC-6 (User id wildcard characters forbidden) — `validateUserId`, `SWHR-C-0111`/`SWHR-C-0112`.
- AC-7 (Password length limit) — `validatePassword` + `getPasswordMaxLength`, `SWHR-C-0113`.
- AC-8, AC-9, AC-10 (Credential authentication) — `authenticate`, `SWHR-C-0114`/`SWHR-C-0115`/`SWHR-C-0116`.

## Verification

```
$ bun --bun vitest run lib/auth/password.test.ts lib/auth/credentials.test.ts
Test Files  2 passed (2)
     Tests  23 passed (23)

$ bun run verify        # lint + typecheck + full suite
Test Files  76 passed (76)
     Tests  348 passed (348)

$ bun run verify:full   # verify + E2E preflight
Playwright Chromium not installed in this container — genuine-absence fallback
(AGENTS.md); verify stands as the green run, E2E not retried.
```

See `tdd-test-result.md` — `TDD-RESULT: 348 passed, 0 failed`.

## Notes

`createCredential` uses `db.insert(...).onConflictDoNothing().returning().get()` rather than a
pre-check `SELECT` then `INSERT`, so the duplicate check is atomic against the primary key instead
of racy — same behavior PLAN.md step 3 describes ("a primary-key conflict becomes `duplicate`"),
implemented without a try/catch.
