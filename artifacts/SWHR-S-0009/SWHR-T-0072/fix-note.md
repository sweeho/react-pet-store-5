# Fix note — SWHR-T-0072

**Root cause:** `@playwright/test` was pinned `~1.50.0` (installed 1.50.1), whose `playwright-core/browsers.json` expects Chromium revision 1155. The standard QA/agent container ships only revision 1223 (Playwright 1.60), so `scripts/ensure-playwright-browser.mjs` found no executable and exited 1.

**Fix:** `@playwright/test` `~1.50.0` → `~1.60.0`; `bun.lock` regenerated. Installed 1.60.0 lists chromium revision 1223. `playwright.config.ts` and `e2e/**` unchanged: they typecheck and lint cleanly under 1.60.

**Files:** `package.json` (devDependency line), `bun.lock`, `src/test/playwrightBrowserRevision.test.ts` (regression test).

**Not verified here:** this container has no Chromium at all, so the preflight and E2E suite (SWHR-C-0453/0454 e2e level) could not be executed; QA/CI must confirm in the standard container.
