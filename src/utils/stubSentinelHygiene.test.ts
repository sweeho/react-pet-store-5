import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

import { parse } from "yaml";
import { describe, expect, it } from "vitest";

/**
 * REGRESSION TEST — SWHR-T-0064, SWHR-T-0065
 *
 * The platform's green-phase stub-sentinel scan (not in this repo) matches
 * the literal sentinel anywhere in the tree. Live stubs in source and test
 * files are legitimate; documentation and configuration must not carry it.
 */
function buildSentinel(): string {
  // Escaped like .vortex/config.yaml so this file never carries the literal.
  return "Vortex\x4EotImplemented";
}

const ROOT = process.cwd();
const DOC_DIRS = ["artifacts", "openspec", ".vortex"];

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else found.push(full);
  }
  return found;
}

function docFiles(root: string): string[] {
  const files = DOC_DIRS.flatMap((d) => {
    try {
      return walk(join(root, d));
    } catch {
      return [];
    }
  });
  const rootMd = readdirSync(root)
    .filter((n) => n.endsWith(".md"))
    .map((n) => join(root, n))
    .filter((f) => statSync(f).isFile());
  return [...files, ...rootMd];
}

function findOffenders(root: string, sentinel: string): string[] {
  return docFiles(root)
    .filter((f) => readFileSync(f, "utf8").includes(sentinel))
    .map((f) => relative(root, f));
}

function withFixture(files: Record<string, string>, run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "sentinel-hygiene-"));
  try {
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), text);
    }
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("stub sentinel hygiene", () => {
  it("[SWHR-C-0441] config stubSentinel is escaped in raw text and decodes to the sentinel", () => {
    const sentinel = buildSentinel();
    const raw = readFileSync(join(ROOT, ".vortex/config.yaml"), "utf8");
    expect(raw).not.toContain(sentinel);

    const match = raw.match(/stubSentinel:\s*"([^"]*)"/);
    expect(match).not.toBeNull();
    const decoded = match![1].replace(/\\x([0-9A-Fa-f]{2})/g, (_all, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
    expect(decoded).toBe(sentinel);
  });

  it("[SWHR-C-0442] config stubSentinel parses to the sentinel through a real YAML parser", () => {
    const sentinel = buildSentinel();
    const doc = parse(readFileSync(join(ROOT, ".vortex/config.yaml"), "utf8")) as {
      testEvidence: { stubSentinel: string };
    };
    expect(doc.testEvidence.stubSentinel).toBe(sentinel);
  });

  it("[SWHR-C-0443] no documentation or config file in the repo contains the literal sentinel", () => {
    const sentinel = buildSentinel();
    const files = docFiles(ROOT).map((f) => relative(ROOT, f));
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain("artifacts/SWHR-S-0006/SPRINT-PLAN.md");
    expect(findOffenders(ROOT, sentinel)).toEqual([]);
  });

  it("[SWHR-C-0444] scan names a non-tdd-test-result Markdown file that quotes the sentinel", () => {
    const sentinel = buildSentinel();
    withFixture(
      {
        "artifacts/SWHR-S-9999/notes.md": `quoted: ${sentinel}`,
        "artifacts/SWHR-S-9999/tdd-test-result.md": "clean",
      },
      (root) => {
        expect(findOffenders(root, sentinel)).toEqual(["artifacts/SWHR-S-9999/notes.md"]);
      },
    );
  });

  it("[SWHR-C-0445] scan ignores live stubs in source and test files", () => {
    const sentinel = buildSentinel();
    withFixture(
      {
        "src/foo.ts": `throw new Error("${sentinel}");`,
        "src/foo.test.ts": `throw new Error("${sentinel}");`,
        "artifacts/SWHR-S-9999/PLAN.md": "clean",
      },
      (root) => {
        expect(findOffenders(root, sentinel)).toEqual([]);
      },
    );
  });

  it("[SWHR-C-0446] hygiene test source does not contain the literal sentinel", () => {
    const sentinel = buildSentinel();
    const source = readFileSync(join(ROOT, "src/utils/stubSentinelHygiene.test.ts"), "utf8");
    expect(source).not.toContain(sentinel);
  });

  it("[SWHR-C-0447] sentinel constant decodes to the 20-character sentinel", () => {
    const sentinel = buildSentinel();
    expect(sentinel).toHaveLength(20);
    expect(sentinel.startsWith("Vortex")).toBe(true);
    const raw = readFileSync(join(ROOT, ".vortex/config.yaml"), "utf8");
    const match = raw.match(/stubSentinel:\s*"([^"]*)"/);
    const decoded = match![1].replace(/\\x([0-9A-Fa-f]{2})/g, (_all, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
    expect(sentinel).toBe(decoded);
  });
});
