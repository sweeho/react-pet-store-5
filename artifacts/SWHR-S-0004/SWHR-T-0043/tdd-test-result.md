---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0043
branch: vortex/feat/SWHR-T-0043-credential-rules-user-id-and-password-ch-9d8770ca
upstream: [artifacts/SWHR-S-0004/SWHR-T-0043/PLAN.md]
---

# TDD result — SWHR-T-0043

## Test cases

| Test                                                                                                                           | Covers                 | Intent                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `lib/auth/credentials.test.ts › createCredential › [SWHR-C-0107] stores exactly one credential for a new user id`              | AC-1 (SWHR-R-0056.01)  | first credential for a fresh user id is stored once                                                         |
| `lib/auth/credentials.test.ts › createCredential › [SWHR-C-0108] rejects a duplicate user id and stores no second credential`  | AC-2 (SWHR-R-0057.01)  | second create for the same id fails, count stays 1                                                          |
| `lib/auth/credentials.test.ts › createCredential › [SWHR-C-0109] rejects a 26-character user id and stores nothing`            | AC-3 (SWHR-R-0058.01)  | 26-char id fails and stores nothing                                                                         |
| `lib/auth/credentials.test.ts › createCredential › [SWHR-C-0110] accepts a 25-character unused user id`                        | AC-4 (SWHR-R-0058.02)  | 25-char id (the limit) is accepted                                                                          |
| `lib/auth/credentials.test.ts › createCredential › [SWHR-C-0111] rejects a user id containing a percent sign`                  | AC-5 (SWHR-R-0059.01)  | `%` in user id fails and stores nothing                                                                     |
| `lib/auth/credentials.test.ts › createCredential › [SWHR-C-0112] rejects a user id containing an asterisk`                     | AC-6 (SWHR-R-0059.02)  | `*` in user id fails and stores nothing                                                                     |
| `lib/auth/credentials.test.ts › createCredential › [SWHR-C-0113] rejects a password one character over the configured maximum` | AC-7 (SWHR-R-0060.01)  | password at max+1 fails and stores nothing                                                                  |
| `lib/auth/credentials.test.ts › authenticate › [SWHR-C-0114] succeeds with the correct password`                               | AC-8 (SWHR-R-0061.01)  | exact password match authenticates                                                                          |
| `lib/auth/credentials.test.ts › authenticate › [SWHR-C-0115] fails when the password differs only in case`                     | AC-9 (SWHR-R-0061.02)  | authentication is case-sensitive                                                                            |
| `lib/auth/credentials.test.ts › authenticate › [SWHR-C-0116] fails for an unknown user id without raising`                     | AC-10 (SWHR-R-0061.03) | unknown user id returns false, never throws                                                                 |
| `lib/auth/credentials.test.ts › validateUserId` (5 cases) and `validatePassword` (4 cases)                                     | AC-3..AC-7             | rule functions in isolation, incl. the configurable password max (`SIGNON_PASSWORD_MAX_LENGTH`, default 25) |
| `lib/auth/password.test.ts` (3 cases)                                                                                          | AC-8, AC-9             | `Bun.password` hash/verify is case-exact and verifies a `Bun.password.hashSync` seed hash (design.md P2)    |

## Red run

`bun --bun vitest run lib/auth/password.test.ts lib/auth/credentials.test.ts`, run against both files committed as stubs whose bodies were only `throw new Error("VortexNotImplemented")`:

```
FAIL  |server| lib/auth/credentials.test.ts > createCredential > [SWHR-C-0107] stores exactly one credential for a new user id
Error: VortexNotImplemented
 ❯ createCredential lib/auth/credentials.ts:26:3

 Test Files  2 failed (2)
      Tests  22 failed | 1 passed (23)
```

The one pass is `exposes the 25-character limit as USER_ID_MAX_LENGTH`, a plain exported constant rather than a stub — every behavioral test failed on the `VortexNotImplemented` sentinel, confirming a real red.

## Green run

`bun run verify` — this stack's full pre-commit gate (`eslint . --max-warnings 0` → `tsc --build` → `bun --bun vitest run`, all project tests, not just this ticket's):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  76 passed (76)
      Tests  348 passed (348)
```

`bun run verify:full` was also run: its E2E preflight (`scripts/ensure-playwright-browser.mjs`) reports Chromium is not installed in this container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing). Per AGENTS.md/PLAYBOOK this is the genuine-absence fallback — E2E runs in the QA/CI containers, not here — so `verify` stands as the green run and E2E was not retried and no browser install was attempted.

TDD-RESULT: 348 passed, 0 failed
