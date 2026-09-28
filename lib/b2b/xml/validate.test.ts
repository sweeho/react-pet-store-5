import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { validateDocument } from "./validate";

const SCHEMAS_DIR = path.join(process.cwd(), "lib/b2b/schemas/files");
const TEST_SCHEMA_FILE = "__validate-test.xsd";
const TEST_SCHEMA_PATH = path.join(SCHEMAS_DIR, TEST_SCHEMA_FILE);

const TEST_SCHEMA = `<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Root">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Required" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

/**
 * Points a deployment catalog entry at a throwaway schema file, since the
 * bundled catalog's real entries don't have files on disk yet (later
 * tickets author them) — this is the same deployment-override seam
 * SWHR-R-0048 defines, used here only to give validateDocument a schema it
 * can actually load.
 */
function withTestSchema(catalogId: string) {
  const tmpDir = mkdtempSync(path.join(tmpdir(), "b2b-validate-"));
  const catalogPath = path.join(tmpDir, "entities.properties");
  writeFileSync(catalogPath, `${catalogId}=${TEST_SCHEMA_FILE}\n`);
  process.env.B2B_ENTITY_CATALOG = catalogPath;
  return tmpDir;
}

describe("validateDocument", () => {
  let tmpDir: string | null = null;

  afterEach(() => {
    delete process.env.B2B_ENTITY_CATALOG;
    if (tmpDir) {
      rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it("returns valid: true with no errors for a document that satisfies its schema", async () => {
    writeFileSync(TEST_SCHEMA_PATH, TEST_SCHEMA);
    tmpDir = withTestSchema("valid-case");

    const result = await validateDocument("<Root><Required>x</Required></Root>", "valid-case");

    expect(result).toEqual({ valid: true, errors: [] });
    rmSync(TEST_SCHEMA_PATH);
  });

  it("reports valid: false with errors for a schema violation, without throwing", async () => {
    writeFileSync(TEST_SCHEMA_PATH, TEST_SCHEMA);
    tmpDir = withTestSchema("invalid-case");

    const result = await validateDocument("<Root/>", "invalid-case");

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    rmSync(TEST_SCHEMA_PATH);
  });

  it("degrades to valid: true when the schema key resolves to nothing", async () => {
    const result = await validateDocument("<Root/>", "no-such-identifier");
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("degrades to valid: true when the resolved schema file is not on disk yet", async () => {
    tmpDir = withTestSchema("missing-file-case");
    rmSync(TEST_SCHEMA_PATH, { force: true });

    const result = await validateDocument("<Root/>", "missing-file-case");

    expect(result).toEqual({ valid: true, errors: [] });
  });
});
