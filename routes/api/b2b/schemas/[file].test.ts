import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { H3Event } from "nitro/h3";
import { afterEach, describe, expect, it, vi } from "vitest";

import getSchema from "./[file].get";

// A fixture identifier/file pair, not a real one from lib/b2b/schemas/catalog.ts.
// Every real catalog entry eventually gets a real, permanently-committed file
// as its owning ticket lands, so using one as a scratch "on disk" / "not yet
// on disk" fixture is a trap: the moment that ticket ships, this suite starts
// writing over and deleting a real bundled schema out from under it (found
// when SWHR-T-0030 landed lib/b2b/schemas/files/PurchaseOrder.dtd.xsd and this
// file's afterEach deleted it during the very next `bun run verify`).
// vi.mock is hoisted above this file's own declarations, so the fixture
// name is inlined here rather than referencing the KNOWN_FILE constant below.
vi.mock("../../../../lib/b2b/schemas/catalog", () => ({
  BUNDLED_SCHEMA_CATALOG: [{ identifier: "test-fixture-id", file: "__route-test-fixture.xsd" }],
}));

const KNOWN_FILE = "__route-test-fixture.xsd";

const SCHEMAS_DIR = path.join(process.cwd(), "lib/b2b/schemas/files");
const KNOWN_FILE_PATH = path.join(SCHEMAS_DIR, KNOWN_FILE);

function eventFor(file: string) {
  return new H3Event(new Request(`http://localhost/api/b2b/schemas/${file}`), {
    params: { file },
  });
}

describe("GET /api/b2b/schemas/:file", () => {
  afterEach(() => {
    rmSync(KNOWN_FILE_PATH, { force: true });
  });

  it("serves a bundled file that is present on disk", async () => {
    writeFileSync(KNOWN_FILE_PATH, "<xs:schema/>");

    const result = await getSchema(eventFor(KNOWN_FILE));

    expect(result).toBe("<xs:schema/>");
  });

  it("404s for a name not in the entity catalog", async () => {
    try {
      await getSchema(eventFor("not-in-the-catalog.xsd"));
      expect.fail("expected getSchema to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 404 });
    }
  });

  it("404s for a catalog-listed name whose file isn't on disk yet", async () => {
    try {
      await getSchema(eventFor(KNOWN_FILE));
      expect.fail("expected getSchema to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 404 });
    }
  });

  it("404s rather than traverse outside the schemas directory", async () => {
    try {
      await getSchema(eventFor("../../../etc/passwd"));
      expect.fail("expected getSchema to throw");
    } catch (error) {
      expect(error).toMatchObject({ status: 404 });
    }
  });
});
