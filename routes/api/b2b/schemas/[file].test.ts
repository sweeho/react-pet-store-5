import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { H3Event } from "nitro/h3";
import { afterEach, describe, expect, it } from "vitest";

import getSchema from "./[file].get";

const SCHEMAS_DIR = path.join(process.cwd(), "lib/b2b/schemas/files");
// A real catalog filename (lib/b2b/schemas/catalog.ts) — no schema is
// authored for it yet, so tests that need actual file bytes write it
// themselves and clean up.
const KNOWN_FILE = "PurchaseOrder.dtd.xsd";
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
