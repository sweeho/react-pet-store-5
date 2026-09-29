// Runs Vitest and Playwright and writes one merged JUnit report to
// .vortex-results/junit.xml (the testEvidence junitPath). See lib/test-evidence.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";

import { runEvidence, VITEST_REPORT } from "../lib/test-evidence/evidence";

const DIR = ".vortex-results";
const run = (cmd: string, args: string[]) =>
  spawnSync(cmd, args, { stdio: "inherit", env: process.env }).status ?? 1;

process.exit(
  runEvidence({
    clean: () => {
      mkdirSync(DIR, { recursive: true });
      for (const f of readdirSync(DIR)) if (f.endsWith(".xml")) rmSync(`${DIR}/${f}`);
    },
    runVitest: () =>
      run("bun", [
        "run",
        "test",
        "--",
        "--reporter=default",
        "--reporter=junit",
        `--outputFile.junit=${VITEST_REPORT}`,
      ]),
    browserInstalled: () => run("bun", ["scripts/ensure-playwright-browser.mjs"]) === 0,
    runPlaywright: () => run("bunx", ["playwright", "test"]),
    read: (f) => {
      try {
        return readFileSync(f, "utf8");
      } catch {
        return undefined;
      }
    },
    write: (f, c) => writeFileSync(f, c),
    log: (l) => console.log(l),
  }),
);
