import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// P14: each implementing ticket writes the approved cases for the
// scenarios it covers, named with their SWHR-C-* id — this makes that
// self-checking rather than trusting a manually maintained list. The
// change directory moves to openspec/changes/archive/<date>-<id>/ at
// sprint close, so look in both places (mirrors lib/b2b/scenarios/
// coverage.test.ts, which broke on swhr-i-0004's archiving until it did).
const CHANGE_ID = "swhr-i-0007-customer-account-and-profile";
const CHANGES_DIR = path.join(process.cwd(), "openspec/changes");
const ARCHIVED_CHANGE = readdirSync(path.join(CHANGES_DIR, "archive")).find((name) =>
  name.endsWith(`-${CHANGE_ID}`),
);
const TEST_CASES_PATH = existsSync(path.join(CHANGES_DIR, CHANGE_ID))
  ? path.join(CHANGES_DIR, CHANGE_ID, "test-cases.md")
  : path.join(CHANGES_DIR, "archive", ARCHIVED_CHANGE ?? CHANGE_ID, "test-cases.md");

// Customer-account's approved cases are unit/integration tests under lib/, routes/,
// and src/ UI tests under src/, and e2e specs under e2e/ — a spread
// across the whole stack (design.md §Sprint planning, phase 7).
const SEARCH_ROOTS = ["lib", "routes", "src", "e2e"].map((dir) => path.join(process.cwd(), dir));
const TEST_FILE_EXTENSIONS = [".test.ts", ".test.tsx", ".spec.ts"];

function approvedCaseIds(): string[] {
  const content = readFileSync(TEST_CASES_PATH, "utf-8");
  const ids = new Set<string>();
  for (const match of content.matchAll(/\*\*(SWHR-C-\d{4})\*\*\s+\([^)]*approved[^)]*\)/g)) {
    ids.add(match[1]);
  }
  return [...ids].sort();
}

function collectTestFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(full));
    } else if (TEST_FILE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

// Every test in this codebase names its case as `it("[SWHR-C-0047] ...")`
// (or on the enclosing `describe`) — restricting to lines that also call
// it/test/describe means a case id left in a stray comment doesn't
// silently count as coverage.
function testTitleLines(): string[] {
  const lines: string[] = [];
  for (const root of SEARCH_ROOTS) {
    for (const file of collectTestFiles(root)) {
      const content = readFileSync(file, "utf-8");
      for (const line of content.split("\n")) {
        if (/\b(it|test|describe)\(/.test(line)) {
          lines.push(line);
        }
      }
    }
  }
  return lines;
}

describe("approved test-case coverage (self-check)", () => {
  it("every approved SWHR-C-* case in test-cases.md is named by at least one test under lib/routes/src/e2e", () => {
    const approved = approvedCaseIds();
    expect(approved.length).toBeGreaterThan(0);

    const titleLines = testTitleLines();
    const missing = approved.filter((id) => !titleLines.some((line) => line.includes(`[${id}]`)));

    expect(missing).toEqual([]);
  });
});
