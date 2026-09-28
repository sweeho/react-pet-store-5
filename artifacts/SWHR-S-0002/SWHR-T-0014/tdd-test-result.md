---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0014
branch: vortex/feat/SWHR-T-0014-session-locale-default-assignment-change-0c44fd69
upstream: [artifacts/SWHR-S-0002/SWHR-T-0014/PLAN.md]
---

# TDD result — SWHR-T-0014

## Test cases

| Test                                                                                                                   | Covers                | Intent                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `lib/locale/session.test.ts › getSessionLocale › [AC-1] assigns the default locale to a session that has none`         | AC-1 (SWHR-R-0006.01) | A fresh session with no locale reads back the configured default                                                                  |
| `lib/locale/session.test.ts › getSessionLocale › [AC-2] preserves an existing session locale across requests`          | AC-2 (SWHR-R-0006.02) | Once `ja_JP` is set, a second request against the same cookie still reads `ja_JP`                                                 |
| `lib/locale/session.test.ts › getSessionLocale › throws when SESSION_PASSWORD is unset in production`                  | PLAN step 1           | The dev-only session password fallback never applies in `NODE_ENV=production`                                                     |
| `lib/locale/session.test.ts › setSessionLocale/getCartLocale › defaults the cart locale when unset`                    | Fixed interface       | `getCartLocale` falls back to the default locale before any cart exists                                                           |
| `lib/locale/session.test.ts › setSessionLocale/getCartLocale › moves the cart locale together with the session locale` | Ticket title / D2     | `setSessionLocale` writes `cartLocale` alongside `locale`                                                                         |
| `routes/api/locale.test.ts › GET /api/locale › [AC-1] assigns and returns the default locale for a new visitor`        | AC-1 (SWHR-R-0006.01) | `middleware/locale.ts` + `GET /api/locale` agree on the default for a new visitor                                                 |
| `routes/api/locale.test.ts › GET /api/locale › [AC-2] preserves an existing session locale on a later request`         | AC-2 (SWHR-R-0006.02) | A locale set by one request is read back, unchanged, by a later one                                                               |
| `routes/api/locale.test.ts › POST /api/locale › [AC-3] rejects an unparseable locale and leaves the session unchanged` | AC-3 (SWHR-R-0009.01) | `{ locale: "ja" }` is rejected with `Unable to change language to ja`; the session keeps its prior locale                         |
| `routes/api/locale.test.ts › POST /api/locale › [AC-4] a later business operation reads the locale after a switch`     | AC-4 (SWHR-R-0010.01) | After switching to `zh_CN`, a later request's `event.context.locale` (how business operations read the locale, per D2) is `zh_CN` |

## Red run

`NODE_ENV=test bun --bun vitest run lib/locale/session.test.ts routes/api/locale.test.ts`, run with `lib/locale/session.ts`, `middleware/locale.ts`, `routes/api/locale.get.ts` and `routes/api/locale.post.ts` removed (temporarily, to prove the tests exercise real modules and not a stub):

```
FAIL  |server| lib/locale/session.test.ts [ lib/locale/session.test.ts ]
Error: Cannot find module './session' imported from /workspace/repo/lib/locale/session.test.ts

FAIL  |server| routes/api/locale.test.ts [ routes/api/locale.test.ts ]
Error: Cannot find module '../../middleware/locale' imported from /workspace/repo/routes/api/locale.test.ts

 Test Files  2 failed (2)
      Tests  no tests
```

Both suites fail to resolve their imports, confirming they are routed to the Vitest `server` project and have no implementation to pass against yet. The four implementation files were then restored unchanged from a backup copy (not re-authored) before continuing.

## Green run

`bun run verify` (`bun run lint && bun run typecheck && bun run test`) — the project's full pre-commit gate. (`bun run verify:full` also ran; its `test:e2e` tier fails only because this container has no Chromium installed — the documented, expected fallback in this case is `verify` alone.)

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  17 passed (17)
      Tests  53 passed (53)
```

All 17 suites (53 tests, including the 9 new tests above) pass; lint (`tsc --build` across both the `tsconfig.json` and `tsconfig.node.json` projects) is clean.

TDD-RESULT: 53 passed, 0 failed
