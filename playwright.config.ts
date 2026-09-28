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
  reporter: "list",
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
    // bun, not npx — the agent containers are npm/npx-free (bun-only runner).
    //
    // Run the bin FILE under `bun --bun` rather than going through `bun x`. Two
    // reasons: Vite's bin carries a `#!/usr/bin/env node` shebang, so anything
    // that honours it starts the dev server under node — where db/client.ts's
    // `bun:sqlite` import dies with ERR_UNSUPPORTED_ESM_URL_SCHEME and every
    // database-backed route 500s, while routes that never touch the database
    // keep working. And naming the file skips bunx's resolution/auto-install
    // step, which can silently eat the whole startup budget on a cold runner.
    command: `rm -f ${E2E_DB_PATH} ${E2E_DB_PATH}-wal ${E2E_DB_PATH}-shm ${E2E_DB_PATH}-journal && bun --bun ./node_modules/vite/bin/vite.js --port ${PORT} --strictPort`,
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
