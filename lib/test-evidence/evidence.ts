import { mergeJunitReports } from "./merge-junit";
import type { JunitReport } from "./merge-junit";

export interface EvidenceDeps {
  clean: () => void;
  runVitest: () => number;
  browserInstalled: () => boolean;
  runPlaywright: () => number;
  read: (file: string) => string | undefined;
  write: (file: string, content: string) => void;
  log: (line: string) => void;
}

export const VITEST_REPORT = ".vortex-results/vitest-junit.xml";
export const E2E_REPORT = ".vortex-results/e2e-junit.xml";
export const MERGED_REPORT = ".vortex-results/junit.xml";

// Runs both test tiers (always both, so a failing unit test never hides e2e
// results), merges their JUnit reports, and returns the process exit code.
export function runEvidence(deps: EvidenceDeps): number {
  deps.clean();
  let exit = deps.runVitest();
  const reports: JunitReport[] = [{ xml: deps.read(VITEST_REPORT) ?? "" }];
  if (deps.browserInstalled()) {
    exit = deps.runPlaywright() || exit;
    reports.push({ xml: deps.read(E2E_REPORT) ?? "", pathPrefix: "e2e/" });
  } else {
    deps.log("[test:evidence] end-to-end tier skipped: no browser installed");
  }
  deps.write(MERGED_REPORT, mergeJunitReports(reports));
  return exit === 0 ? 0 : 1;
}
