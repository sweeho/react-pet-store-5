# Fix note — SWHR-T-0050

Change: `swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00` (design.md §D2).

## Root cause

`package.json`'s `"dev"` script was plain `vite`, which resolves to
`node_modules/vite/bin/vite.js` — a file carrying a `#!/usr/bin/env node`
shebang. `bun run <script>` honours that shebang whenever a `node` binary is
on PATH, so on any machine with both Bun and Node installed (CI's
`ubuntu-latest`, most developer machines), the dev server actually runs
under Node. `db/client.ts` imports the `bun:sqlite` builtin, which Node
cannot resolve, so every route that reaches it (any database-backed route,
e.g. `/api/catalog/categories`) 500s. It didn't reproduce in a Bun-only
agent container (no `node` on PATH at all) because Bun then runs `vite.js`
itself regardless of the script's contents — that's why this defect went
unnoticed here and in the planning container.

`playwright.config.ts`'s `webServer.command` already avoided the bug by
invoking `bun --bun ./node_modules/vite/bin/vite.js` directly instead of
going through `bun run dev`, which is why E2E never caught the regression:
it was testing a different entry point than the one developers/CI actually
run via `bun run dev`.

## Minimal fix

1. `package.json` — changed `"dev"` from `"vite"` to
   `"bun --bun ./node_modules/vite/bin/vite.js"`, the exact invocation
   Playwright already proved forces the Bun runtime regardless of what's on
   PATH. `db/client.ts` and `vite.config.ts` are untouched.
2. `playwright.config.ts` — changed `webServer.command` to start through
   the dev script (`bun run dev --port 5178 --strictPort`) instead of
   invoking Vite's bin directly, keeping the existing db-cleanup prefix,
   `env.SQLITE_PATH` and `--strictPort`. This makes the E2E suite exercise
   the same entry point developers and CI use, so a future regression here
   fails a database-backed E2E spec again.

No change to `vite.config.ts` or `db/client.ts` (fixed contract).

## Files touched

- `package.json` — `dev` script only.
- `playwright.config.ts` — `webServer.command` only (comment updated to
  explain the new invocation; port/env/timeout/strictPort unchanged).
- `src/test/devServerConfig.test.ts` — new regression test, [SWHR-C-0434].
- `src/test/devServerRuntime.test.ts` — new regression test, [SWHR-C-0433].
- `e2e/catalog-browsing.spec.ts` — tagged the existing DOGS-listing spec
  with `[SWHR-C-0435]`; already exercises "category page lists database
  products, no error state" once E2E's web server starts through the dev
  script.

## Known limitation (documented, not a defect)

This agent container has no `node` binary on PATH at all (verified: no
`node`, no `nvm`, nothing under common install paths). `src/test/devServerRuntime.test.ts`
([SWHR-C-0433]) can only reproduce the pre-fix 500 on a machine where Node
is actually present — matching the defect's own reproduction notes and
PLAN.md step 3. In this container the test passes even pre-fix, because Bun
runs Vite directly when there's no Node to hand the shebang to. CI's
`ubuntu-latest` has Node on PATH and is the real regression guard; see
`tdd-test-result.md` for how this was handled during the red run.
