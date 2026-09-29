# PLAN — SWHR-T-0050: dev server 500s on routes that load db/client.ts

Change: `swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00`. Read `openspec/changes/swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00/design.md` first.

## Objective

The dev entry point runs route handlers under Bun even when Node is on PATH, and the E2E web server starts through that same entry point, so CI catches a regression.

## Steps

1. Change `package.json` `"dev"` to the Bun-forcing invocation in design.md §D2.
2. Change `playwright.config.ts` `webServer.command` to start through the dev script with port 5178 and `--strictPort`. Keep the db-file cleanup prefix, `env.SQLITE_PATH` and the timeout (design.md §D2).
3. With Node on PATH, reproduce AC-1 against `/api/catalog/categories?locale=en_US` (`GET /api/users` no longer exists). If the agent container has no Node, say so in the work log; CI's `ubuntu-latest` has Node and gives the regression evidence through AC-2.
4. Update README's `bun run dev` text only if it describes the runtime.

## File/module ownership

- `package.json` (the `dev` script only)
- `playwright.config.ts` (`webServer` only)
- `README.md` (only if step 4 applies)

## Definition of Done

AC-1 through AC-3 on the ticket hold, and CI (which has Node on PATH) runs the E2E suite green through the dev script.
