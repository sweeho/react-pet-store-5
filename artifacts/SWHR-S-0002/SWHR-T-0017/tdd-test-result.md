---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0017
branch: vortex/feat/SWHR-T-0017-preferred-language-stored-preference-app-7798466b
upstream: [artifacts/SWHR-S-0002/SWHR-T-0017/PLAN.md]
---

# TDD result — SWHR-T-0017

## Test cases

| Test                                                                                                                                                            | Covers                | Intent                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| `lib/locale/preference.test.ts › applyPreferredLanguageOnSignOn › [AC-1] switches the session locale and the cart locale to the customer's Japanese preference` | AC-1 (SWHR-R-0011.01) | Sign-on with a `ja_JP` profile switches session + cart locale to `ja_JP`                   |
| `lib/locale/preference.test.ts › applyPreferredLanguageOnProfileSave › [AC-2] switches the session locale and the cart locale to the newly saved preference`    | AC-2 (SWHR-R-0011.02) | Saving a profile with `zh_CN` switches session + cart locale to `zh_CN`                    |
| `lib/locale/preference.test.ts › applyPreferredLanguageOnSignOn › [AC-3] succeeds and leaves the session locale unchanged for a user with no profile`           | AC-3 (SWHR-R-0011.03) | Sign-on for a user with no profile row does not throw and does not touch the session       |
| `lib/locale/preference.test.ts › profiles.preferredLanguage default › [AC-4] defaults to en_US when a profile is created without a language`                    | AC-4 (SWHR-R-0012.01) | Inserting a `profiles` row without `preferredLanguage` reads back `en_US` (column default) |

## Red run

`bun run test -- lib/locale/preference`

Run with `lib/locale/preference.ts` temporarily removed (the test file was written first and already imports it):

```
FAIL  |server| lib/locale/preference.test.ts [ lib/locale/preference.test.ts ]
Error: Cannot find module './preference' imported from /workspace/repo/lib/locale/preference.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

Confirms the suite runs (in the `server` Vitest project, against the real in-memory db) and genuinely has no implementation to pass against yet.

## Green run

`bun run verify` (`bun run lint && bun run typecheck && bun run test`) — the project's full pre-commit gate, after restoring `lib/locale/preference.ts`, adding the `profiles` table to `db/schema.ts`/`db/client.ts`, and generating the `drizzle/0001_glamorous_supernaut.sql` migration.

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  21 passed (21)
      Tests  69 passed (69)
```

All 21 suites (69 tests, including the 4 new `lib/locale/preference.test.ts` cases) pass; lint and `tsc --build` are clean.

TDD-RESULT: 69 passed, 0 failed
