import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { resolveEntity } from "./resolver";

const TPA_INVOICE_ID = "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD TPA-Invoice 1.0//EN";

describe("resolveEntity", () => {
  let tmpDir: string | null = null;

  afterEach(() => {
    delete process.env.B2B_ENTITY_CATALOG;
    if (tmpDir) {
      rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it("prefers a caller-supplied resolver over everything else", () => {
    const resolved = resolveEntity(TPA_INVOICE_ID, "http://example.com/fallback.xsd", {
      resolver: () => ({ location: "from-caller-resolver", source: "resolver" }),
    });
    expect(resolved).toEqual({ location: "from-caller-resolver", source: "resolver" });
  });

  it("falls through to the catalog when the caller resolver returns null", () => {
    const resolved = resolveEntity(TPA_INVOICE_ID, null, { resolver: () => null });
    expect(resolved?.location).toBe("TPAInvoice.dtd.xsd");
  });

  /**
   * SWHR-R-0048.01 / SWHR-C-0091 (AC-2): a deployment catalog mapping wins
   * over the bundled mapping for the same identifier.
   */
  it("[SWHR-C-0091] deployment catalog location wins over the bundled mapping", () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), "b2b-entity-catalog-"));
    const catalogPath = path.join(tmpDir, "entities.properties");
    writeFileSync(catalogPath, `${TPA_INVOICE_ID}=locationB\n`);
    process.env.B2B_ENTITY_CATALOG = catalogPath;

    const resolved = resolveEntity(TPA_INVOICE_ID, "http://example.com/never-used.xsd");

    expect(resolved).toEqual({ location: "locationB", source: "catalog" });
    expect(resolved?.location).not.toBe("TPAInvoice.dtd.xsd");
  });

  it("uses the bundled mapping when no deployment catalog overrides it", () => {
    const resolved = resolveEntity(TPA_INVOICE_ID, null);
    expect(resolved).toEqual({ location: "TPAInvoice.dtd.xsd", source: "catalog" });
  });

  /**
   * SWHR-R-0048.02 / SWHR-C-0092 (AC-3): an identifier absent from both
   * catalogs falls back to the document's own system location.
   */
  it("[SWHR-C-0092] unmapped identifier uses the schema location named in the document", () => {
    const resolved = resolveEntity("unknown-identifier", "locationC");
    expect(resolved).toEqual({ location: "locationC", source: "system" });
  });

  it("returns null when nothing resolves, for default resolution", () => {
    expect(resolveEntity(null, null)).toBeNull();
    expect(resolveEntity("unknown-identifier", null)).toBeNull();
  });

  it("ignores a deployment catalog file that does not exist", () => {
    process.env.B2B_ENTITY_CATALOG = "/nonexistent/path/entities.properties";
    const resolved = resolveEntity(TPA_INVOICE_ID, null);
    expect(resolved).toEqual({ location: "TPAInvoice.dtd.xsd", source: "catalog" });
  });
});
