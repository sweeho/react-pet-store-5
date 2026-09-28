import { describe, expect, it } from "vitest";

import { BUNDLED_SCHEMA_CATALOG, lookupBundledSchemaFile } from "./catalog";

describe("BUNDLED_SCHEMA_CATALOG", () => {
  it("maps every identifier in design.md P9", () => {
    const identifiers = BUNDLED_SCHEMA_CATALOG.map((entry) => entry.identifier);

    expect(identifiers).toContain(
      "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD PurchaseOrder 1.1//EN",
    );
    expect(identifiers).toContain(
      "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD SupplierOrder 1.1//EN",
    );
    expect(identifiers).toContain(
      "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD PurchaseOrder 1.0//EN",
    );
    for (const name of ["ContactInfo", "Address", "CreditCard", "LineItem"]) {
      expect(identifiers).toContain(
        `-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD ${name} 1.1//EN`,
      );
    }
    for (const name of ["TPA-SupplierOrder", "TPA-Invoice", "TPA-LineItem"]) {
      expect(identifiers).toContain(
        `-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD ${name} 1.0//EN`,
      );
    }
    expect(identifiers).toContain("http://blueprints.j2ee.sun.com/TPASupplierOrder");
    expect(identifiers).toContain("http://blueprints.j2ee.sun.com/TPAInvoice");
  });

  it("has a unique file for every identifier", () => {
    const identifiers = BUNDLED_SCHEMA_CATALOG.map((entry) => entry.identifier);
    expect(new Set(identifiers).size).toBe(identifiers.length);
  });
});

describe("lookupBundledSchemaFile", () => {
  it("returns the file for a known identifier", () => {
    expect(
      lookupBundledSchemaFile(
        "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD PurchaseOrder 1.1//EN",
      ),
    ).toBe("PurchaseOrder.dtd.xsd");
  });

  it("returns null for an unknown identifier", () => {
    expect(lookupBundledSchemaFile("not-a-known-identifier")).toBeNull();
  });
});
