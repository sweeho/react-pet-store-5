import { defineConfig, devices } from "@playwright/test";

// Fixed, dedicated port (distinct from the normal dev port 5000) so
// baseURL always matches what the server actually bound to — `--strictPort`
// makes Vite fail fast instead of silently picking a different port.
const PORT = 5178;

// SWHR-T-0048: a throwaway database per run, not the persistent dev
// sqlite.db — e2e/sign-on.spec.ts signs up real credentials ('alice',
// 'dave', 'frank', 'iris'), and a shared file across repeated local runs
// would collide on those user names. db/client.ts reads SQLITE_PATH
// (SWHR-T-0042); the file is deleted here, as a prefix to the `command`
// itself, so the delete always runs immediately before the server process
// that would recreate it — not left to globalSetup, whose ordering
// relative to webServer startup isn't a contract worth relying on.
const E2E_DB_PATH = "e2e-test.db";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The JUnit report is Vortex's test evidence for the e2e cases: CI uploads
  // .vortex-results/ and Vortex reads every report in it. Without it an e2e
  // case never has an official result, and a failing e2e test was missing
  // from the evidence of a red CI run (SWHR-S-0008, SWHR-C-0432).
  reporter: [["list"], ["junit", { outputFile: ".vortex-results/e2e-junit.xml" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Start through the project's own `dev` script rather than invoking Vite's
    // bin directly, so E2E exercises the same entry point developers and CI
    // actually run (SWHR-T-0050). `dev` itself is `bun --bun ./node_modules/vite/bin/vite.js`
    // — Vite's bin carries a `#!/usr/bin/env node` shebang, so anything that
    // honours it starts the dev server under node, where db/client.ts's
    // `bun:sqlite` import dies with ERR_UNSUPPORTED_ESM_URL_SCHEME and every
    // database-backed route 500s. `bun run dev` on a machine with Node on PATH
    // (CI's ubuntu-latest) is exactly the case that regressed, so routing E2E
    // through it makes the suite the regression guard.
    command: `rm -f ${E2E_DB_PATH} ${E2E_DB_PATH}-wal ${E2E_DB_PATH}-shm ${E2E_DB_PATH}-journal && bun run dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { SQLITE_PATH: E2E_DB_PATH },
    // Cold runners pay for Vite's first-run dependency optimization here. 30s sat
    // below the real cold cost, so the same commit could pass on one machine and
    // time out on another. This is a ceiling, not a wait — warm starts still
    // return in about a second.
    timeout: 120_000,
    stdout: "pipe",
  },
});
