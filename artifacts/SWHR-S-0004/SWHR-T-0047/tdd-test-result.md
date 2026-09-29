---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0047
branch: vortex/feat/SWHR-T-0047-administrator-and-supplier-access-role-g-eb2b5b63
upstream: [artifacts/SWHR-S-0004/SWHR-T-0047/PLAN.md]
---

# TDD result — SWHR-T-0047

## Test cases

| Test                                                                                                                                | Covers                             | Intent                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `lib/auth/roles.test.ts` (7 tests)                                                                                                  | AC-3 (SWHR-R-0076.01, server half) | `hasRole` direct/group/cross-realm; `requireRole` 401/403/pass.                                                        |
| `routes/api/staff/signon.test.ts › [SWHR-C-0141] rejects the wrong password...`                                                     | AC-4 (SWHR-R-0077.01)              | wrong password → `/admin/login-error`, no session created.                                                             |
| `routes/api/staff/signon.test.ts` (3 more)                                                                                          | AC-3, AC-9 (server halves)         | admin/supplier success redirects, invalid-realm 400.                                                                   |
| `routes/api/staff/signoff.test.ts › [SWHR-C-0142] ends the admin session...`                                                        | AC-5 (SWHR-R-0078.01)              | sign-out → `/admin`, follow-up session check shows not signed on.                                                      |
| `routes/api/staff/signoff.test.ts › [SWHR-C-0147] ends the supplier session...`                                                     | AC-10 (SWHR-R-0083.01)             | supplier sign-out → `/supplier/signed-out`, follow-up shows not signed on.                                             |
| `routes/api/staff/signoff.test.ts` (1 more)                                                                                         | supporting                         | invalid-realm 400.                                                                                                     |
| `routes/api/staff/session.test.ts › [SWHR-C-0143] reports not signed on for an administrator idle past the 54-minute admin timeout` | AC-6 (SWHR-R-0079.01)              | idle 55 min → `signedOn: false`.                                                                                       |
| `routes/api/staff/session.test.ts` (4 more)                                                                                         | supporting                         | anonymous/administrator/non-administrator reports, invalid-realm 400.                                                  |
| `routes/api/admin/orders.test.ts › [SWHR-C-0144] returns 401 with the timeout message...`                                           | AC-7 (SWHR-R-0080.01)              | idle-expired admin session → `{ error: "Session Timed Out..." }`, no data.                                             |
| `routes/api/admin/orders.test.ts` (4 more)                                                                                          | supporting                         | anonymous 401, role-not-required success, `Authorization: Session` header accepted/rejected.                           |
| `routes/api/admin/launch.test.ts › [SWHR-C-0145] returns a session-bound descriptor...`                                             | AC-8 (SWHR-R-0081.01)              | launch descriptor's session id succeeds against `/api/admin/orders` via the header, no cookie.                         |
| `routes/api/admin/launch.test.ts` (1 more)                                                                                          | supporting                         | 403 without the role.                                                                                                  |
| `src/components/auth/StaffSignInForm.test.tsx` (4 tests)                                                                            | AC-4, AC-9 (form half)             | never pre-filled, one message per empty field, calls back, accessible name/placeholders.                               |
| `src/pages/admin/index.test.tsx` (2 tests, rewritten)                                                                               | design ref                         | landing page heading + Sign in link, en/de.                                                                            |
| `src/pages/admin/console.test.tsx › [SWHR-C-0138] redirects to the administrator sign-in form...`                                   | AC-1 (SWHR-R-0075.01)              | not signed on → `/admin/signin`.                                                                                       |
| `src/pages/admin/console.test.tsx › [SWHR-C-0139] refuses access for an authenticated non-administrator`                            | AC-2 (SWHR-R-0075.02)              | signed on, no role → "Access refused", no console heading.                                                             |
| `src/pages/admin/console.test.tsx` (3 more)                                                                                         | AC-3, AC-5, AC-8 (client halves)   | console renders Manage orders/Sign out; sign-out navigates to `/admin`; Manage orders reports the launched session id. |
| `src/pages/admin/signin.test.tsx` (3 tests)                                                                                         | AC-4, design ref                   | mockup heading/hint/labels; posts `realm: "admin"`; success/failure redirects.                                         |
| `src/pages/admin/login-error.test.tsx` (1 test)                                                                                     | AC-4, design ref                   | mockup content + link back to `/admin/signin`.                                                                         |
| `src/pages/supplier/index.test.tsx › [SWHR-C-0146] shows a not-authorised message and no update form...`                            | AC-9 (SWHR-R-0082.01)              | signed on, no role → the message, no form/button.                                                                      |
| `src/pages/supplier/index.test.tsx` (2 more)                                                                                        | supporting                         | not signed on → `/supplier/signin`; administrator → inventory placeholder.                                             |
| `src/pages/supplier/signin.test.tsx` (3 tests)                                                                                      | AC-9, design ref                   | mockup heading/hint; posts `realm: "supplier"`; success/failure redirects.                                             |
| `src/pages/supplier/login-error.test.tsx` (1 test)                                                                                  | AC-4-equivalent, design ref        | mockup content + link back to `/supplier/signin`.                                                                      |
| `src/pages/supplier/signed-out.test.tsx` (1 test)                                                                                   | AC-10                              | heading + link back into the supplier application.                                                                     |

## Red run

`NODE_ENV=test bun --bun vitest run lib/auth/roles.test.ts routes/api/staff/ routes/api/admin/ src/components/auth/StaffSignInForm.test.tsx src/pages/admin/ src/pages/supplier/`, with every new/changed implementation file (`lib/auth/roles.ts`, the five new routes, `StaffSignInForm.tsx`, all eight admin/supplier pages) stubbed to `throw new Error(<configured stub sentinel>)`:

```
 ❯ |client| src/pages/supplier/signin.test.tsx (3 tests | 3 failed)
 ❯ |client| src/pages/admin/signin.test.tsx (3 tests | 3 failed)
 ❯ |client| src/components/auth/StaffSignInForm.test.tsx (4 tests | 4 failed)
 ❯ |client| src/pages/admin/console.test.tsx (5 tests | 5 failed)
 ❯ |client| src/pages/supplier/index.test.tsx (3 tests | 3 failed)
 ❯ |client| src/pages/admin/login-error.test.tsx (1 test | 1 failed)
 ❯ |client| src/pages/supplier/login-error.test.tsx (1 test | 1 failed)
 ❯ |client| src/pages/supplier/signed-out.test.tsx (1 test | 1 failed)
 ❯ |client| src/pages/admin/index.test.tsx (2 tests | 2 failed)
 ❯ |server| routes/api/admin/orders.test.ts (5 tests | 5 failed)
 ❯ |server| routes/api/staff/signon.test.ts (4 tests | 4 failed)
 ❯ |server| routes/api/staff/session.test.ts (5 tests | 5 failed)
 ❯ |server| routes/api/admin/launch.test.ts (2 tests | 2 failed)
 ❯ |server| routes/api/staff/signoff.test.ts (3 tests | 3 failed)
 ❯ |server| lib/auth/roles.test.ts (7 tests | 7 failed)

 Test Files  15 failed (15)
      Tests  49 failed (49)
```

## Green run

`bun run verify` (this stack's full gate — lint + typecheck + the complete Vitest suite):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  111 passed (111)
      Tests  492 passed (492)
```

`bun run verify:full`'s E2E tier could not run in this container: `scripts/ensure-playwright-browser.mjs` reports Chromium is not installed at the expected path. Per AGENTS.md this is not retried here — E2E runs in the QA phase / CI, and SWHR-C-0140 (the full sign-in-then-see-the-console browser flow) is SWHR-T-0048's.

TDD-RESULT: 492 passed, 0 failed
