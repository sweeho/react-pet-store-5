// The bundled identifier-to-schema-file map (design.md P9). Every document
// type identifier this capability exchanges is listed here even though
// most of the actual schema files are authored by later tickets — the map
// itself is this ticket's job; `validateDocument` and the schema route
// both degrade gracefully (never throw / 404) when a listed file isn't on
// disk yet.
//
// A DTD-declared identifier (a public identifier) and its document's
// XML-Schema-declared form (a namespace) are validated against different
// local files, because DTD validation itself is unavailable under Bun
// (design.md finding) — every DTD-declared identifier is instead validated
// against an XSD equivalent named `<Name>.dtd.xsd` (P1), while a namespace
// identifier is validated against the document's native `<Name>.xsd`.

export interface SchemaCatalogEntry {
  /** A document type's public identifier or namespace. */
  identifier: string;
  /** Filename under lib/b2b/schemas/files/. */
  file: string;
}

const BLUEPRINTS_PUBLIC_ID = (name: string, version: string): string =>
  `-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD ${name} ${version}//EN`;

export const BUNDLED_SCHEMA_CATALOG: readonly SchemaCatalogEntry[] = [
  // Purchase order (SWHR-R-0024) and its embedded elements (1.1).
  { identifier: BLUEPRINTS_PUBLIC_ID("PurchaseOrder", "1.1"), file: "PurchaseOrder.dtd.xsd" },
  { identifier: BLUEPRINTS_PUBLIC_ID("ContactInfo", "1.1"), file: "ContactInfo.dtd.xsd" },
  { identifier: BLUEPRINTS_PUBLIC_ID("Address", "1.1"), file: "Address.dtd.xsd" },
  { identifier: BLUEPRINTS_PUBLIC_ID("CreditCard", "1.1"), file: "CreditCard.dtd.xsd" },
  { identifier: BLUEPRINTS_PUBLIC_ID("LineItem", "1.1"), file: "LineItem.dtd.xsd" },

  // Internal supplier order (SWHR-R-0033, 1.1).
  { identifier: BLUEPRINTS_PUBLIC_ID("SupplierOrder", "1.1"), file: "SupplierOrder.dtd.xsd" },

  // Trading-partner documents (1.0) — DTD-declared and XML-Schema-declared
  // forms are separate files for the same document (SWHR-R-0044.02).
  {
    identifier: BLUEPRINTS_PUBLIC_ID("TPA-SupplierOrder", "1.0"),
    file: "TPASupplierOrder.dtd.xsd",
  },
  {
    identifier: "http://blueprints.j2ee.sun.com/TPASupplierOrder",
    file: "TPASupplierOrder.xsd",
  },
  { identifier: BLUEPRINTS_PUBLIC_ID("TPA-Invoice", "1.0"), file: "TPAInvoice.dtd.xsd" },
  { identifier: "http://blueprints.j2ee.sun.com/TPAInvoice", file: "TPAInvoice.xsd" },
  { identifier: BLUEPRINTS_PUBLIC_ID("TPA-LineItem", "1.0"), file: "TPALineItem.dtd.xsd" },

  // Legacy version 1.0 purchase order (SWHR-R-0052, "#Old DTDs" — MAY support).
  { identifier: BLUEPRINTS_PUBLIC_ID("PurchaseOrder", "1.0"), file: "PurchaseOrder-1.0.dtd.xsd" },
] as const;

export function lookupBundledSchemaFile(identifier: string): string | null {
  const entry = BUNDLED_SCHEMA_CATALOG.find((candidate) => candidate.identifier === identifier);
  return entry ? entry.file : null;
}
