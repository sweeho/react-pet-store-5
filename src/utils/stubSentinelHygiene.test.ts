import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * REGRESSION TEST — SWHR-T-0064
 *
 * The platform's green-phase stub-sentinel scan (not in this repo) matches
 * the literal sentinel string anywhere in the tree, including its own
 * declaration in config and prose describing past stub swaps in merged
 * artifacts. Guards the repo-side mitigation: the literal text stays out of
 * both locations while the configured value still decodes to the original
 * sentinel, so live stubs are still detected.
 */
const SENTINEL = "VortexNotImplemented";
const ROOT = process.cwd();

function findFiles(dir: string, isMatch: (name: string) => boolean): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...findFiles(full, isMatch));
    } else if (isMatch(entry)) {
      found.push(full);
    }
  }
  return found;
}

describe("stub sentinel hygiene", () => {
  it("keeps .vortex/config.yaml free of the literal sentinel while it still decodes to the sentinel", () => {
    const raw = readFileSync(join(ROOT, ".vortex/config.yaml"), "utf8");
    expect(raw).not.toContain(SENTINEL);

    const match = raw.match(/stubSentinel:\s*"([^"]*)"/);
    expect(match).not.toBeNull();
    const decoded = match![1].replace(/\\x([0-9A-Fa-f]{2})/g, (_all, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
    expect(decoded).toBe(SENTINEL);
  });

  it("keeps every merged artifacts/**/tdd-test-result.md free of the literal sentinel", () => {
    const files = findFiles(join(ROOT, "artifacts"), (name) => name === "tdd-test-result.md");
    expect(files.length).toBeGreaterThan(0);

    const offenders = files.filter((file) => readFileSync(file, "utf8").includes(SENTINEL));
    expect(offenders).toEqual([]);
  });
});
