---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0013
branch: vortex/feat/SWHR-T-0013-locale-model-supported-locales-default-a-7bf2d058
upstream: [artifacts/SWHR-S-0002/SWHR-T-0013/PLAN.md]
---

# TDD result — SWHR-T-0013

## Test cases

| Test                                                                                                                                          | Covers                         | Intent                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `lib/locale/model.test.ts › SUPPORTED_LOCALES › lists exactly en_US, ja_JP and zh_CN`                                                         | AC-1 (SWHR-R-0005.02 backdrop) | Supported locale list is exactly the three storefront locales              |
| `lib/locale/model.test.ts › getDefaultLocale › [AC-1] is en_US when no deployment configuration is set`                                       | AC-1                           | Default locale reads `en_US`                                               |
| `lib/locale/model.test.ts › getDefaultLocale › reads the deployment configuration when it is set`                                             | AC-1 (configurable)            | `DEFAULT_LOCALE` env overrides the default                                 |
| `lib/locale/model.test.ts › parseLocale › [AC-2] interprets a two-part identifier as that language and country`                               | AC-2                           | `ja_JP` parses to language `ja`, country `JP`                              |
| `lib/locale/model.test.ts › parseLocale › [AC-3] interprets the literal default, compared case-insensitively, as the server's default locale` | AC-3                           | `default`/`DEFAULT`/`Default` all resolve to the configured default locale |
| `lib/locale/model.test.ts › parseLocale › [AC-4] yields no locale for an identifier without a separator`                                      | AC-4                           | `en` (no `_`) is rejected                                                  |
| `lib/locale/model.test.ts › parseLocale › yields no locale for an absent identifier`                                                          | AC-4 backdrop                  | `null`/`undefined`/`""` are rejected                                       |
| `lib/locale/model.test.ts › parseLocale › does not rely on any meaning for a three-part identifier`                                           | D1                             | `en_US_POSIX` is rejected, not guessed                                     |
| `lib/locale/model.test.ts › isSupportedLocale › accepts each supported locale`                                                                | AC-1                           | Type guard accepts the three supported locales                             |
| `lib/locale/model.test.ts › isSupportedLocale › rejects a locale outside the supported list`                                                  | AC-1                           | Type guard rejects e.g. `de_DE`                                            |

## Red run

`bun run test -- lib/locale`

```
FAIL  |server| lib/locale/model.test.ts [ lib/locale/model.test.ts ]
Error: Cannot find module './model' imported from /workspace/repo/lib/locale/model.test.ts

 Test Files  1 failed (1)
      Tests  no tests
```

Written before `lib/locale/model.ts` existed — the test file imports it and fails to resolve, confirming the suite runs (routed to the `server` Vitest project by the `tsconfig.node.json`/`vitest.config.ts` harness change) and genuinely has no implementation to pass against yet.

## Green run

`bun run verify` (`bun run lint && bun run typecheck && bun run test`) — the project's full pre-commit gate.

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  15 passed (15)
      Tests  44 passed (44)
```

All 15 suites (44 tests, including the 10 new `lib/locale/model.test.ts` cases) pass; lint and `tsc --build` (both the `tsconfig.json`/src and `tsconfig.node.json` projects) are clean.

Additionally confirmed per PLAN.md step 3 — a throwaway SPA import of `lib/locale/model.ts` (added, verified, then removed; not part of the committed diff) built cleanly under both `bun run typecheck` (`tsc --build`) and `vite build`, proving `lib/` is reachable from both TypeScript projects without adding `lib` to `tsconfig.json`'s own `include`.

TDD-RESULT: 44 passed, 0 failed
