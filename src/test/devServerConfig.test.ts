import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import playwrightConfig from "../../playwright.config";

/**
 * UNIT TEST
 *
 * Reads the real playwright.config.ts and package.json — not fixtures —
 * so a future edit to either one that reintroduces SWHR-T-0050 (E2E or the
 * dev script invoking Vite's bin directly, which honours its Node shebang)
 * fails here without needing a full server spin-up.
 */
describe("[SWHR-C-0434] dev entry point wiring", () => {
  it("package.json's dev script forces the Bun runtime", () => {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

    expect(pkg.scripts.dev).toMatch(/^bun --bun /);
  });

  it("Playwright's web server starts through the dev script, not Vite directly, keeping port 5178, strict port and a fresh SQLITE_PATH", () => {
    const webServer = playwrightConfig.webServer;
    if (!webServer || Array.isArray(webServer)) {
      throw new Error("expected a single webServer config, not an array");
    }
    const { command, url, env } = webServer;

    expect(command).toContain("bun run dev");
    expect(command).not.toMatch(/vite\.js/);
    expect(command).toContain("--port 5178");
    expect(command).toContain("--strictPort");
    expect(url).toBe("http://localhost:5178");
    expect(env).toMatchObject({ SQLITE_PATH: expect.any(String) });
  });
});
