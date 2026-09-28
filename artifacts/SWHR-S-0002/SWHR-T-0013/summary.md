---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0013
branch: vortex/feat/SWHR-T-0013-locale-model-supported-locales-default-a-7bf2d058
upstream: [artifacts/SWHR-S-0002/SWHR-T-0013/PLAN.md]
downstream: [artifacts/SWHR-S-0002/qa-test-report.md]
---

# Summary — SWHR-T-0013: Locale model — supported locales, default and identifier parser

## What changed

Added `lib/locale/model.ts`, the single locale model shared by server and SPA (design D1/P1): the three supported locales, a configurable default (`DEFAULT_LOCALE` env, falling back to `en_US`), and the one `language_COUNTRY` parser. Wired `lib/` into the `tsconfig.node.json` TypeScript project and the Vitest `server` project so `lib/**/*.test.ts` runs there instead of jsdom.

## Files

- `lib/locale/model.ts` (new) — `SUPPORTED_LOCALES`, `getDefaultLocale`, `parseLocale`, `isSupportedLocale`, per the ticket's fixed interface contract.
- `lib/locale/model.test.ts` (new) — unit tests for every acceptance criterion plus the absent/three-part edge cases.
- `tsconfig.node.json` — added `lib` to `include`.
- `vitest.config.ts` — routed `lib/**/*.test.ts` to the `server` project and excluded `lib/**` from `client` to avoid double-running it in jsdom.

## AC coverage

- AC-1 (Supported storefront locales — default is `en_US`): `getDefaultLocale()` returns `en_US` absent configuration — `lib/locale/model.test.ts › getDefaultLocale`.
- AC-2 (Two-part identifier → Japanese language/country): `parseLocale("ja_JP")` — `lib/locale/model.test.ts › parseLocale › [AC-2]`.
- AC-3 (The literal `default` → server's default locale, case-insensitive): `parseLocale("default"|"DEFAULT"|"Default")` — `lib/locale/model.test.ts › parseLocale › [AC-3]`.
- AC-4 (No separator → no locale, invalid): `parseLocale("en")` returns `null` — `lib/locale/model.test.ts › parseLocale › [AC-4]`.

## Verification

- `bun run test -- lib/locale` — red before `model.ts` existed (module not found), green after (10/10 passed).
- `bun run verify` (lint + `tsc --build` + full unit suite) — 15 test files, 44 tests passed; lint and typecheck clean.
- Throwaway SPA-side import of `lib/locale/model.ts`, built under both `bun run typecheck` and `vite build` — confirmed reachable from both TS projects, then removed (not part of the committed diff).

Full detail: `tdd-test-result.md`.

## Notes

None — implemented to `PLAN.md`'s fixed interface contract with no deviation.
