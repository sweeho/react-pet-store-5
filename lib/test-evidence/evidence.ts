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

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub
export function runEvidence(_deps: EvidenceDeps): number {
  throw new Error("VortexNotImplemented");
}
