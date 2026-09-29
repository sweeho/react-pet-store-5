# PLAN — SWHR-T-0072: Playwright browser revision mismatch

Change: `swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00` · Requirement: **End-to-end browser matches the pinned test runner** (`local-development`)

## Design reference

No design blocks: this bugfix sprint has no idea canvas design.

## Objective

The pinned `@playwright/test` expects Chromium revision 1223, so the E2E preflight passes and the full suite runs in the standard QA/agent container. The root cause is in `openspec/changes/swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00/proposal.md` §Why.

## Steps

1. Read `design.md` §Context and D3.
2. Bump `@playwright/test` to `~1.60.0` in `package.json` and regenerate `bun.lock`. Confirm the installed `playwright-core/browsers.json` lists chromium revision 1223.
3. Check the Playwright 1.51–1.60 breaking changes against what this repo uses (D3). Adapt `playwright.config.ts` / `e2e/**` only where the suite actually fails.
4. In the standard container, run the preflight and then the full E2E suite.

## File/module ownership

- `package.json` (the `@playwright/test` devDependency line only)
- `bun.lock`
- `playwright.config.ts`, `e2e/**`: only if 1.60 breaks them

Fixed interface: `playwright.config.ts` keeps its port 5178, `SQLITE_PATH` web server env, and both reporters (`list`, and `junit` → `.vortex-results/e2e-junit.xml`). SWHR-T-0070 and CI depend on that report path.

## Definition of Done

AC-1 and AC-2 of the ticket. Record the preflight output and the E2E pass count in the ticket's work log.
