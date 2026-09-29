import { describe, expect, it } from "vitest";

import { mergeJunitReports } from "./merge-junit";

const vitestXml = `<?xml version="1.0" encoding="UTF-8" ?>
<testsuites name="vitest tests" tests="2" failures="0" errors="0" time="0.1">
    <testsuite name="routes/api/x.test.ts" timestamp="t" hostname="h" tests="2" failures="0" errors="0" skipped="0" time="0.1">
        <testcase classname="routes/api/x.test.ts" name="a" time="0.01">
        </testcase>
        <testcase classname="routes/api/x.test.ts" name="b" time="0.01">
        </testcase>
    </testsuite>
</testsuites>
`;

const playwrightXml = `<testsuites id="" name="" tests="3" failures="1" skipped="0" errors="0" time="2">
<testsuite name="home.spec.ts" timestamp="t" hostname="chromium" tests="3" failures="1" skipped="0" errors="0" time="2">
<testcase name="home renders" classname="home.spec.ts" time="1">
</testcase>
<testcase name="home links" classname="home.spec.ts" time="1">
</testcase>
<testcase name="home broken" classname="home.spec.ts" time="1">
<failure message="boom" type="FAILURE">
</failure>
</testcase>
</testsuite>
</testsuites>`;

describe("mergeJunitReports", () => {
  it("[SWHR-C-0455] prefixes Playwright suites with e2e/ and sums counts", () => {
    const merged = mergeJunitReports([
      { xml: vitestXml },
      { xml: playwrightXml, pathPrefix: "e2e/" },
    ]);
    expect(merged.match(/<testsuites /g)).toHaveLength(1);
    const root = merged.match(/<testsuites [^>]*>/)![0];
    expect(root).toContain('tests="5"');
    expect(root).toContain('failures="1"');
    expect(merged).toContain('<testsuite name="routes/api/x.test.ts"');
    expect(merged).toContain('<testsuite name="e2e/home.spec.ts"');
    expect(merged).toContain('classname="e2e/home.spec.ts"');
    expect(merged).not.toContain('classname="home.spec.ts"');
    // Vitest suite preserved byte-for-byte
    const vitestSuite = vitestXml.slice(
      vitestXml.indexOf("<testsuite "),
      vitestXml.indexOf("</testsuite>") + "</testsuite>".length,
    );
    expect(merged).toContain(vitestSuite);
  });
});
