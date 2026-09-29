import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import net from "node:net";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * INTEGRATION TEST — SWHR-T-0050
 *
 * `bun run dev` used to be plain `vite`, whose bin carries a
 * `#!/usr/bin/env node` shebang. On a machine with Node on PATH, Bun
 * honours that shebang and runs the dev server under Node, where
 * db/client.ts's `bun:sqlite` import fails and every database-backed
 * route 500s. This spawns the real dev script as a subprocess — the only
 * way to exercise that shebang-resolution behaviour — and hits a real
 * database-backed route through it. It reproduces the defect whenever
 * Node is on PATH (this repo's CI runner always has one); an agent
 * container with no Node on PATH cannot reproduce it, because Bun then
 * runs Vite itself regardless of the dev script's contents.
 */
const DB_PATH = "vitest-dev-server-runtime.db";

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const { port } = address;
        server.close(() => resolve(port));
      } else {
        reject(new Error("failed to acquire a free port"));
      }
    });
  });
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new Error(`server at ${url} did not become ready in time: ${String(lastError)}`);
}

describe("[SWHR-C-0433] dev entry point serves a database-backed route", () => {
  let child: ChildProcess;
  let port: number;

  beforeAll(async () => {
    for (const suffix of ["", "-wal", "-shm", "-journal"]) {
      rmSync(`${DB_PATH}${suffix}`, { force: true });
    }

    port = await getFreePort();

    const env: Record<string, string | undefined> = { ...process.env, SQLITE_PATH: DB_PATH };
    delete env.VITEST;
    child = spawn("bun", ["run", "dev", "--port", String(port), "--strictPort"], {
      cwd: process.cwd(),
      env,
      stdio: "pipe",
    });

    await waitForServer(`http://localhost:${port}/`, 60_000);
  }, 65_000);

  afterAll(() => {
    child?.kill();
    for (const suffix of ["", "-wal", "-shm", "-journal"]) {
      if (existsSync(`${DB_PATH}${suffix}`)) rmSync(`${DB_PATH}${suffix}`, { force: true });
    }
  });

  it("serves GET /api/catalog/categories with 200 and a non-empty categories list, not a Node ESM-loader error", async () => {
    const response = await fetch(`http://localhost:${port}/api/catalog/categories?locale=en_US`);
    const body = await response.text();

    expect(body).not.toMatch(/ERR_UNSUPPORTED_ESM_URL_SCHEME|bun:sqlite/);
    expect(response.status).toBe(200);

    const json = JSON.parse(body) as { categories?: unknown[] };
    expect(Array.isArray(json.categories)).toBe(true);
    expect(json.categories!.length).toBeGreaterThan(0);
  });
});
