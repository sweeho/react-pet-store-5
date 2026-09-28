---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0048
branch: vortex/feat/SWHR-T-0048-sign-on-test-suite-approved-test-case-co-2a8f504c
upstream: [artifacts/SWHR-S-0004/SWHR-T-0048/PLAN.md]
downstream: [artifacts/SWHR-S-0004/qa-test-report.md]
---

# Summary — SWHR-T-0048: Sign-on test suite

## What changed

Added the archive-proof coverage self-check for all 49 approved cases (SWHR-C-0099–0147) and
`e2e/sign-on.spec.ts` for the eight browser journeys, wired a throwaway database per Playwright
run so repeated e2e runs don't collide on user names, and made the still-placeholder `/search`
page state its keyword (the one gap coverage found: SWHR-C-0106 needs a page that "states the
keyword", which the pre-existing placeholder never did).

## Files

- `lib/auth/scenarios/coverage.test.ts` — new: reads `test-cases.md` (change dir or its archived
  copy), collects every approved id, asserts each is named by a test under `lib/routes/middleware/
src/e2e` (generalizes `lib/b2b/scenarios/coverage.test.ts`'s pattern to the wider set of
  directories this change touches).
- `e2e/sign-on.spec.ts` — new: SWHR-C-0103, 0106, 0117, 0130, 0132, 0134, 0135, 0140.
- `playwright.config.ts` — `webServer.command` now deletes `e2e-test.db` (+ `-wal`/`-shm`/
  `-journal`) before launching the server, and `webServer.env` points `SQLITE_PATH` at it.
- `.gitignore` — the four `e2e-test.db*` throwaway-database filenames.
- `src/pages/search.tsx`, `src/i18n/screens/search.ts` (+test) — the placeholder now reads
  `?keywords=` and states it in the heading; unchanged when no keyword is present.

## AC coverage

- AC-1 (every approved case named by a passing test, archive-proof) — `lib/auth/scenarios/
coverage.test.ts`. All 39 non-e2e cases already had tests from SWHR-T-0043–0047; the 8 e2e-only
  cases needed `e2e/sign-on.spec.ts` (below). Archive-proofing: mirrors the b2b coverage test's
  already-proven `existsSync(...) ? change-dir : archive-dir` resolution.
- AC-2 (eight e2e cases pass in a browser against a fresh database) — `e2e/sign-on.spec.ts` +
  `playwright.config.ts`'s fresh `SQLITE_PATH`. See Notes: not executable in this container: see
  Notes below.

## Verification

```
$ bun --bun vitest run lib/auth/scenarios/coverage.test.ts src/pages/search.test.tsx
Test Files  2 passed (2)
     Tests  4 passed (4)

$ bun run verify        # lint + typecheck + full suite
Test Files  112 passed (112)
     Tests  494 passed (494)

$ bun run verify:full   # verify + E2E preflight
Playwright Chromium not installed at the pinned version in this container —
genuine-absence fallback (AGENTS.md); verify stands as the green run.
```

See `tdd-test-result.md` — `TDD-RESULT: 494 passed, 0 failed`, and its account of the coverage
test's real red→green (8 missing ids → 0).

## Notes

- **`e2e/sign-on.spec.ts` could not be run locally.** This container's `/ms-playwright/` has only
  `chromium-1223`; `@playwright/test@~1.50.0` (this project's pin) resolves to `chromium-1155`,
  which is absent. Per AGENTS.md/PLAYBOOK this is the documented genuine-absence fallback — not
  retried, no browser installed, no version bump. **This ticket's DONE is gated on CI's E2E tier
  reporting green**, confirmed via `a2a_await_ci` before transitioning.
- **The first CI push was red, and hand review had missed it.** `getByLabel("User name")` /
  `getByLabel("Password")` without `{ exact: true }` substring-match "Remember My User Name" and
  "Repeat password" respectively (Playwright's `getByLabel` matches a substring by default, not
  the whole accessible name) — CI's trace showed both, failing 5 of the 8 tests. Fixed with
  `exact: true` throughout the spec. Re-reading the file after that fix (rather than re-pushing
  immediately) surfaced two more defects the failed run never reached, both in SWHR-C-0135 only:
  the quantity/item-name assertions were still English strings after the test switches the session
  to Japanese (`"Quantity: 3"` → `"数量: 3"`, and the product-page item filter → the Japanese item
  name), and the post-sign-out header check queried `role: "button"` for "サインイン" when the
  anonymous Sign In control is a `<Link>` (`role: "link"`), not a button. All four are fixed;
  `bun run typecheck`/`lint` pass, and a second CI push is the actual proof this ticket rests on.
- **`src/pages/search.tsx` is outside this ticket's file ownership**, but SWHR-C-0106 (assigned to
  this ticket by PLAN.md) requires the page to "state the keyword", which the placeholder never
  did. The fix is one conditional heading line, additive, and doesn't touch the "coming soon" empty
  state or break either existing `search.test.tsx` case (no `?keywords=` in either, so both keep
  asserting the plain title).
- **`e2e/global-setup.ts` needed no change.** The fresh-database delete lives in `webServer.command`
  itself (runs immediately before the server process starts, regardless of its ordering against
  `globalSetup`), not in the setup script.
