import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// SD-8: each implementing ticket writes the approved cases for the
// scenarios it covers, named with their SWHR-C-* id — this makes that
// self-checking rather than trusting a manually maintained list.
// The change directory moves to openspec/changes/archive/<date>-<id>/ at
// sprint close, so look in both places.
const CHANGE_ID = "swhr-i-0004-partner-document-exchange";
const CHANGES_DIR = path.join(process.cwd(), "openspec/changes");
const ARCHIVED_CHANGE = readdirSync(path.join(CHANGES_DIR, "archive")).find((name) =>
  name.endsWith(`-${CHANGE_ID}`),
);
const TEST_CASES_PATH = existsSync(path.join(CHANGES_DIR, CHANGE_ID))
  ? path.join(CHANGES_DIR, CHANGE_ID, "test-cases.md")
  : path.join(CHANGES_DIR, "archive", ARCHIVED_CHANGE ?? CHANGE_ID, "test-cases.md");
const LIB_B2B_DIR = path.join(process.cwd(), "lib/b2b");

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
    } else if (entry.name.endsWith(".test.ts")) {
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
  for (const file of collectTestFiles(LIB_B2B_DIR)) {
    const content = readFileSync(file, "utf-8");
    for (const line of content.split("\n")) {
      if (/\b(it|test|describe)\(/.test(line)) {
        lines.push(line);
      }
    }
  }
  return lines;
}

describe("approved test-case coverage (SD-8 self-check)", () => {
  it("every approved SWHR-C-* case in test-cases.md is named by at least one test under lib/b2b", () => {
    const approved = approvedCaseIds();
    expect(approved.length).toBeGreaterThan(0);

    const titleLines = testTitleLines();
    const missing = approved.filter((id) => !titleLines.some((line) => line.includes(`[${id}]`)));

    expect(missing).toEqual([]);
  });
});
