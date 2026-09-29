export interface JunitReport {
  xml: string;
  pathPrefix?: string;
}

const COUNTERS = ["tests", "failures", "errors", "skipped"] as const;

const SUITE_PATTERN = /<testsuite\b[^>]*\/>|<testsuite\b[\s\S]*?<\/testsuite>/g;

function attr(tag: string, name: string): number {
  const match = tag.match(new RegExp(`\\s${name}="(\\d+)"`));
  return match ? Number(match[1]) : 0;
}

function prefixPaths(suite: string, prefix: string): string {
  return suite
    .replace(/^(<testsuite\b[^>]*?\sname=")/, `$1${prefix}`)
    .replace(/(<testcase\b[^>]*?\sclassname=")/g, `$1${prefix}`);
}

// Merges JUnit reports into one <testsuites> root. Suites are copied verbatim;
// only reports with a pathPrefix have suite names and testcase classnames
// rewritten, so a Playwright result is attributed to its repository path.
export function mergeJunitReports(reports: JunitReport[]): string {
  const totals = { tests: 0, failures: 0, errors: 0, skipped: 0 };
  const suites: string[] = [];
  for (const { xml, pathPrefix } of reports) {
    for (const found of xml.match(SUITE_PATTERN) ?? []) {
      const suite = pathPrefix ? prefixPaths(found, pathPrefix) : found;
      const openTag = suite.match(/^<testsuite\b[^>]*>/)![0];
      for (const counter of COUNTERS) totals[counter] += attr(openTag, counter);
      suites.push(suite);
    }
  }
  const counts = COUNTERS.map((c) => `${c}="${totals[c]}"`).join(" ");
  return `<?xml version="1.0" encoding="UTF-8" ?>\n<testsuites name="test evidence" ${counts}>\n${suites.map((s) => `    ${s}\n`).join("")}</testsuites>\n`;
}
