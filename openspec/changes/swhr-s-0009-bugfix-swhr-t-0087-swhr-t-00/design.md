# Design — swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00

## Context (measured on sprint base `ee8a6fd`)

- `db/client.ts:30` runs `sqlite.exec("PRAGMA foreign_keys = ON")`, then `migrate(db, …)` at line 34. The SD3 comment says enforcement must be ON before `migrate` "so the enforcement also covers the table rebuilds". That premise is what breaks: a rebuild drops a parent table while children reference it.
- `drizzle/0005_mean_mach_iv.sql` rebuilds `itemDetails`, `category`, `categoryDetails`, `item`, `product`, `productDetails`. `drizzle/0006_parched_may_parker.sql` contains a further `PRAGMA foreign_keys=OFF` + rebuild of `profiles`. Both pragmas are no-ops inside the migrator's transaction.
- Repro (planning): migrate a file db through 0004 with a trimmed `meta/_journal.json`, insert `category('FISH')` + `product('FI-1','FISH')`, reopen, migrate with the full folder. Enforcement ON → `FOREIGN KEY constraint failed` on `DROP TABLE category`. Enforcement OFF → applies through 0006, 1 product kept, `foreign_key_check` empty.
- `node_modules/@playwright/test` is 1.50.1; its `playwright-core/browsers.json` chromium revision is 1155. `@playwright/test` 1.60.0 exists on the registry.
- `.vortex/config.yaml` `testEvidence`: `command: bun run test -- --reporter=junit --outputFile=.vortex-results/junit.xml`, `junitPath: .vortex-results/junit.xml`. `playwright.config.ts` reporters: `list` + `junit` → `.vortex-results/e2e-junit.xml`. `.github/workflows/ci.yml` runs Vitest (writes `junit.xml`), then `bunx playwright install --with-deps chromium`, then `bun run test:e2e`, then uploads `.vortex-results/`.

## D1 — Migrations run with enforcement OFF, outside any transaction (SWHR-T-0087)

New module `lib/db/migrate.ts` exports:

`migrateDatabase(sqlite: Database, migrationsFolder: string): void`

Order: `PRAGMA foreign_keys = OFF` → drizzle `migrate(drizzle(sqlite), { migrationsFolder })` → `PRAGMA foreign_keys = ON` → `PRAGMA foreign_key_check`. If the check returns any row, throw an `Error` whose message names each offending table. Enforcement is ON again before the throw, so a caller that catches the error is not left with enforcement disabled.

`db/client.ts` replaces its pragma + `migrate` call with `migrateDatabase(sqlite, path.join(process.cwd(), "drizzle"))`, keeping the SD3 comment's intent (enforcement ON for the running app) and correcting its premise. Nothing else in `db/client.ts` changes: seeds still run after migration, with enforcement ON.

The function lives under `lib/` so its test runs in the Vitest `server` project, and `lib/**/*.test.ts` is already in `testGlobs`. That avoids touching `vitest.config.ts` or `.vortex/config.yaml`, which SWHR-T-0070 owns.

Migration SQL files are NOT edited. They are already applied on fresh databases, and drizzle checks each migration's hash.

## D2 — Testing the upgrade path (SWHR-T-0087)

`lib/db/migrate.test.ts` works on a file database in a temp directory. It must not import `db/client.ts`, which uses `:memory:` under Vitest. It builds a "through 0004" migrations folder by copying `drizzle/` with `meta/_journal.json` filtered to `idx <= 4`. It applies that, seeds rows in `category`, `categoryDetails`, `product`, `productDetails`, `item`, `itemDetails` (plain inserts or `seedCatalog` — either is fine), then calls `migrateDatabase` with the real `drizzle/` folder. The assertions map one-to-one to the `database-migrations` scenarios. The dangling-reference case inserts an orphan `product` row with enforcement OFF before upgrading.

## D3 — Playwright 1.60.x (SWHR-T-0072)

Set `"@playwright/test": "~1.60.0"` and regenerate `bun.lock`. The installed `playwright-core/browsers.json` must list chromium revision 1223. Review the Playwright 1.51–1.60 release notes for breaking changes to what this repo uses (`defineConfig`, `webServer`, `globalSetup`, `devices`, the `junit`/`list` reporters, `chromium.executablePath()`), and adapt `playwright.config.ts` / `e2e/**` only where the suite actually breaks. `scripts/ensure-playwright-browser.mjs` stays as is.

## D4 — One evidence command runs both tiers (SWHR-T-0070)

We keep `e2e/**/*.spec.ts` in `testGlobs`. Removing it (the defect's option 1) would stop CI e2e results from `ee8a6fd` counting as evidence, and would make spec edits count as production code at the red gate.

New `scripts/test-evidence.ts`, exposed as package script `test:evidence`. `testEvidence.command` becomes `bun run test:evidence`, and `junitPath` stays `.vortex-results/junit.xml`. The script:

1. Deletes stale `.vortex-results/*.xml`.
2. Runs Vitest with the JUnit reporter to `.vortex-results/vitest-junit.xml` and records its exit code.
3. Runs the browser preflight (`scripts/ensure-playwright-browser.mjs`, invoked with `bun`). If it passes, runs Playwright (its config already writes `.vortex-results/e2e-junit.xml`) and records the exit code. If it fails, prints one line saying E2E was skipped because no browser is installed, and treats E2E as not run.
4. Always runs both tiers, even when the first fails. The red phase needs every failing case reported, not just the first tier's.
5. Writes the merged report to `.vortex-results/junit.xml` (D5).
6. Exits non-zero if any tier that ran failed.

CI is unchanged: it still writes Vitest's `junit.xml` and Playwright's `e2e-junit.xml` separately and uploads the folder.

## D5 — Merging JUnit reports

`lib/test-evidence/merge-junit.ts` exports:

`mergeJunitReports(reports: { xml: string; pathPrefix?: string }[]): string`

The function is pure: string in, string out, no filesystem access. It collects every `<testsuite …>…</testsuite>` element and wraps them in one `<testsuites>` root. The root's `tests`, `failures`, `errors` and `skipped` attributes are the sums of the suites' own values. When `pathPrefix` is given (the script passes `e2e/` for the Playwright report), it prefixes each suite's `name` attribute and each testcase's `classname` attribute, so a Playwright result names its spec by repository path (`e2e/catalog-browsing.spec.ts`). Vitest results already name files by repository path. Before coding, measure both reports' actual attribute shapes from a real run; the merge must preserve Vitest output byte-for-byte inside each suite.

## Risks

- Playwright 1.60 may change `webServer` or reporter behaviour. The full E2E suite passing on 1.60 is SWHR-T-0072's own acceptance criterion.
- Adding the E2E tier makes each `a2a_run_tests` run longer (red runs twice). This is accepted: it is the only way e2e cases get evidence locally.
- Whether the platform matches Playwright results by repository path is unverified from inside the repo (proposal F1). SWHR-T-0070's agent records the reasons from its own `a2a_run_tests` green run as the live check.
