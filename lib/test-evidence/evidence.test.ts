import { describe, expect, it } from "vitest";

import { E2E_REPORT, MERGED_REPORT, runEvidence, VITEST_REPORT } from "./evidence";
import type { EvidenceDeps } from "./evidence";

const suite = (name: string, failing = false) =>
  `<testsuites tests="1" failures="${failing ? 1 : 0}" errors="0"><testsuite name="${name}" tests="1" failures="${failing ? 1 : 0}" errors="0" skipped="0"><testcase classname="${name}" name="t">${failing ? "<failure/>" : ""}</testcase></testsuite></testsuites>`;

function harness(opts: {
  unitExit?: number;
  e2eExit?: number;
  browser?: boolean;
  unitFails?: boolean;
  e2eFails?: boolean;
}) {
  const files = new Map<string, string>();
  const logs: string[] = [];
  const calls: string[] = [];
  const deps: EvidenceDeps = {
    clean: () => files.clear(),
    runVitest: () => {
      calls.push("vitest");
      files.set(VITEST_REPORT, suite("src/a.test.ts", opts.unitFails));
      return opts.unitExit ?? 0;
    },
    browserInstalled: () => opts.browser ?? true,
    runPlaywright: () => {
      calls.push("playwright");
      files.set(E2E_REPORT, suite("home.spec.ts", opts.e2eFails));
      return opts.e2eExit ?? 0;
    },
    read: (f) => files.get(f),
    write: (f, c) => void files.set(f, c),
    log: (l) => void logs.push(l),
  };
  return { deps, files, logs, calls };
}

describe("runEvidence", () => {
  it("[SWHR-C-0456] report holds e2e results by repository path plus unit results", () => {
    const h = harness({});
    expect(runEvidence(h.deps)).toBe(0);
    const merged = h.files.get(MERGED_REPORT)!;
    expect(merged).toContain('name="src/a.test.ts"');
    expect(merged).toContain('name="e2e/home.spec.ts"');
  });

  it("[SWHR-C-0457] a failing unit test exits non-zero and keeps e2e results", () => {
    const h = harness({ unitExit: 1, unitFails: true });
    expect(runEvidence(h.deps)).not.toBe(0);
    expect(h.calls).toEqual(["vitest", "playwright"]);
    const merged = h.files.get(MERGED_REPORT)!;
    expect(merged).toContain("<failure");
    expect(merged).toContain('name="e2e/home.spec.ts"');
  });

  it("[SWHR-C-0458] a failing e2e test exits non-zero and is recorded as a failure", () => {
    const h = harness({ e2eExit: 1, e2eFails: true });
    expect(runEvidence(h.deps)).not.toBe(0);
    const merged = h.files.get(MERGED_REPORT)!;
    expect(merged).toMatch(/<testsuite name="e2e\/home\.spec\.ts"[^>]*failures="1"/);
    expect(merged).toContain("<failure");
  });

  it("[SWHR-C-0459] without a browser it skips e2e, says so, and reflects unit status only", () => {
    const h = harness({ browser: false });
    expect(runEvidence(h.deps)).toBe(0);
    expect(h.calls).toEqual(["vitest"]);
    expect(h.logs.join("\n")).toMatch(/end-to-end.*skipped.*no browser/i);
    const merged = h.files.get(MERGED_REPORT)!;
    expect(merged).toContain('name="src/a.test.ts"');
    expect(merged).not.toContain("e2e/");
    expect(runEvidence(harness({ browser: false, unitExit: 1 }).deps)).not.toBe(0);
  });
});
