# TDD result — SWHR-T-0086

## Test cases

- `lib/account/scenarios/coverage.test.ts`: every approved SWHR-C case in the change's `test-cases.md` is named by a test under lib/routes/src/e2e (archive-path aware).
- `e2e/account.spec.ts`: "New shopper creates an account…" and "Shopper views and edits their account: the city changes to San Jose".
- `e2e/personalisation.spec.ts`: My List and the fish pet-tips banner appear with preferences on and disappear once both are turned off.

## Red run

No separate red run. The change's implementing tickets had already written a named test for every approved case, so the coverage test passes on first run (no gap to fill, no `*.scenarios.test.*` file needed). The journeys exercise features already merged on the sprint branch, so they passed on first run too. Nothing was fabricated as a red.

## Green run

- `bun --bun vitest run lib/account/scenarios`: 1 passed.
- Playwright (`e2e/account.spec.ts`, `e2e/personalisation.spec.ts`): 5 passed (two are the earlier SWHR-C-0230/0231 tests in the same file). Also re-ran `e2e/sign-on.spec.ts` (8 passed) after the registration-step change from SWHR-T-0083.
- Full gate `bun run verify` exit 0: 145 files, 706 tests passed.

`bun run test:e2e` cannot start here (its preflight expects Chromium 1155; the container has 1223). I ran the specs with a throwaway Playwright config outside the commit that points at the installed Chromium; it is not committed.

TDD-RESULT: 6 passed, 0 failed
