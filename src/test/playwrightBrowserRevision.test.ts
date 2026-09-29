import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The standard QA/agent container ships only Chromium revision 1223. The
// pinned test runner must expect that same revision, or the E2E preflight
// (scripts/ensure-playwright-browser.mjs) exits 1 and no E2E test can run.
const CONTAINER_CHROMIUM_REVISION = "1223";

const browsers = JSON.parse(
  readFileSync(path.join(process.cwd(), "node_modules/playwright-core/browsers.json"), "utf8"),
) as { browsers: { name: string; revision: string }[] };

describe("pinned Playwright runner", () => {
  it("[SWHR-C-0453] expects the Chromium revision the standard container ships", () => {
    const chromium = browsers.browsers.find((b) => b.name === "chromium");
    expect(chromium?.revision).toBe(CONTAINER_CHROMIUM_REVISION);
  });

  it("[SWHR-C-0454] resolves the Chromium executable under the container revision", async () => {
    const { chromium } = await import("@playwright/test");
    expect(chromium.executablePath()).toContain(`chromium-${CONTAINER_CHROMIUM_REVISION}`);
  });
});
