import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Keeps every approved case of change swhr-i-0013-customer-notifications
 * (and SWHR-C-0001 from localization) bound to a test. The list is literal,
 * not read from openspec/changes/, which moves at archive.
 */
const APPROVED_CASES: readonly string[] = [
  "SWHR-C-0001",
  ...Array.from({ length: 18 }, (_, i) => `SWHR-C-${String(413 + i).padStart(4, "0")}`),
];

const ROOTS = ["lib", "plugins"].map((dir) => path.join(process.cwd(), dir));

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

// Only lines that call it/test/describe count, so an id left in a comment is not coverage.
function testTitleLines(): string[] {
  return ROOTS.flatMap(collectTestFiles).flatMap((file) =>
    readFileSync(file, "utf-8")
      .split("\n")
      .filter((line) => /\b(it|test|describe)(\.each\([^)]*\))?\(/.test(line)),
  );
}

describe("customer-notification case coverage", () => {
  it("lists SWHR-C-0001 and SWHR-C-0413 to SWHR-C-0430", () => {
    expect(APPROVED_CASES).toHaveLength(19);
    expect(APPROVED_CASES.at(-1)).toBe("SWHR-C-0430");
  });

  it("every approved case is cited by a test title under lib or plugins", () => {
    const titles = testTitleLines();
    const missing = APPROVED_CASES.filter((id) => !titles.some((line) => line.includes(`[${id}]`)));
    expect(missing).toEqual([]);
  });
});
