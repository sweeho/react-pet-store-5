# Proposal — swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00

## Why

Three defects, all reproduced or re-verified on the sprint base `ee8a6fd`:

- **SWHR-T-0087 — an existing deployment cannot upgrade.** `db/client.ts` turns `PRAGMA foreign_keys` ON before `migrate()`. Drizzle's bun-sqlite migrator runs every pending migration inside one transaction, and SQLite ignores `PRAGMA foreign_keys` inside a transaction, so the `PRAGMA foreign_keys=OFF` at the top of `drizzle/0005_mean_mach_iv.sql` does nothing. The table rebuild then runs `DROP TABLE category` while `product` rows reference it, and the migrator aborts with `FOREIGN KEY constraint failed`. Reproduced: a file database migrated through 0004 with one category and one product fails at 0005 with enforcement ON. With enforcement OFF around `migrate()`, 0005 and 0006 both apply, the row is kept and `PRAGMA foreign_key_check` returns nothing. An empty or fresh database passes either way, which is why CI stayed green.
- **SWHR-T-0070 — an e2e-level test case never gets a valid `a2a_run_tests` run.** `.vortex/config.yaml` `testEvidence.testGlobs` includes `e2e/**/*.spec.ts`, but `testEvidence.command` runs Vitest only, and neither Vitest project (`vitest.config.ts`: `client` excludes `e2e`, `server` includes only `routes|lib|plugins|middleware`) can load a Playwright spec. Commit `ee8a6fd` since made CI upload Playwright's JUnit report (`.vortex-results/e2e-junit.xml`), so the e2e glob now serves CI evidence and must stay. The gap is only the local evidence command.
- **SWHR-T-0072 — E2E cannot start in the QA/agent container.** The repo pins `@playwright/test` `~1.50.0` (installed 1.50.1, whose `playwright-core/browsers.json` expects Chromium revision 1155), but the container ships only revision 1223 (Playwright 1.60.0), so `scripts/ensure-playwright-browser.mjs` exits 1. `@playwright/test` 1.60.0 is published. This planning container ships no browser at all, so the revision-1223 failure is taken from triage's reproduction; the version mapping was verified from the installed package.

## What Changes

- Opening a database runs migrations with foreign-key enforcement OFF, turns it back ON, and refuses to start if `PRAGMA foreign_key_check` reports dangling references (SWHR-T-0087).
- `@playwright/test` moves to 1.60.x, matching the container's Chromium revision (SWHR-T-0072).
- The test-evidence command runs the Playwright suite as well as Vitest and writes one merged JUnit report at the configured path, so e2e test cases get an official result (SWHR-T-0070).

## Impact

- Capabilities: **database-migrations** (new), **local-development** (two added requirements).
- Code: `db/client.ts`, new `lib/db/migrate.ts`; `package.json`, `bun.lock`, possibly `playwright.config.ts` / `e2e/**`; `.vortex/config.yaml` `testEvidence.command`, new `scripts/test-evidence.ts`, new `lib/test-evidence/merge-junit.ts`.
- Environments still holding Chromium revision 1155 (local machines) need `bun x playwright install chromium` once after the bump. CI already installs the browser matching the pinned version.

## Follow-ups / out of scope

- **F1 — Playwright JUnit names are testDir-relative.** Playwright's JUnit reporter names each suite by its path relative to `testDir` (`catalog-browsing.spec.ts`), not the repository path (`e2e/catalog-browsing.spec.ts`). SWHR-T-0070 normalises this in the merged local report (design D5). The CI artifact from `ee8a6fd` uploads the raw Playwright file. If the platform matches results to citations by repository path, CI e2e evidence may still fail to match. Needs a platform-side check; not filed.
- **F2 — the Playwright preflight runs under `node`.** `pretest:e2e`, `pree2e` and `pretest:smoke` call `node scripts/ensure-playwright-browser.mjs`. A container with Bun but no Node (such as this planning container) fails there with `node: command not found`, not with the actionable preflight message. That conflicts with AGENTS.md ("Everything runs under bun"). Not filed.
- **F3 — repo pin and image revision can drift again.** Nothing ties the container image's `VORTEX_PLAYWRIGHT_VERSION` to `package.json`. Aligning them is platform/image work outside this repository.
