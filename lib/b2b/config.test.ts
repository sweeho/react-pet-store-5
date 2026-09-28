import { afterEach, describe, expect, it } from "vitest";

import { getEntityCatalogPath, getSchemaForm, isValidationEnabled } from "./config";

const ENV_KEYS = [
  "B2B_VALIDATE_PURCHASE_ORDER",
  "B2B_VALIDATE_ORDER_APPROVAL",
  "B2B_VALIDATE_INVOICE",
  "B2B_VALIDATE_SUPPLIER_ORDER",
  "B2B_SCHEMA_FORM",
  "B2B_ENTITY_CATALOG",
];

describe("isValidationEnabled", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  it("is on by default for every document kind", () => {
    expect(isValidationEnabled("purchaseOrder")).toBe(true);
    expect(isValidationEnabled("orderApproval")).toBe(true);
    expect(isValidationEnabled("invoice")).toBe(true);
    expect(isValidationEnabled("supplierOrder")).toBe(true);
  });

  it("is off only when its switch is set to 'false'", () => {
    process.env.B2B_VALIDATE_INVOICE = "false";
    expect(isValidationEnabled("invoice")).toBe(false);
    expect(isValidationEnabled("purchaseOrder")).toBe(true);
  });

  it("is independent per document kind", () => {
    process.env.B2B_VALIDATE_SUPPLIER_ORDER = "false";
    expect(isValidationEnabled("supplierOrder")).toBe(false);
    expect(isValidationEnabled("orderApproval")).toBe(true);
  });
});

describe("getSchemaForm", () => {
  afterEach(() => {
    delete process.env.B2B_SCHEMA_FORM;
  });

  it("defaults to dtd", () => {
    expect(getSchemaForm()).toBe("dtd");
  });

  it("returns xsd when selected", () => {
    process.env.B2B_SCHEMA_FORM = "xsd";
    expect(getSchemaForm()).toBe("xsd");
  });

  it("falls back to dtd for an unrecognised value", () => {
    process.env.B2B_SCHEMA_FORM = "bogus";
    expect(getSchemaForm()).toBe("dtd");
  });
});

describe("getEntityCatalogPath", () => {
  afterEach(() => {
    delete process.env.B2B_ENTITY_CATALOG;
  });

  it("is null when unset", () => {
    expect(getEntityCatalogPath()).toBeNull();
  });

  it("returns the configured path", () => {
    process.env.B2B_ENTITY_CATALOG = "/deploy/entities.properties";
    expect(getEntityCatalogPath()).toBe("/deploy/entities.properties");
  });
});
