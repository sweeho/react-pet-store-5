// Per-deployment B2B document exchange configuration (design.md P7).
// Read directly from process.env on every call — this configuration
// changes only between deployments (or between test cases, via
// process.env), never within a request, so there is nothing worth caching.

export type DocumentKind = "purchaseOrder" | "orderApproval" | "invoice" | "supplierOrder";

const VALIDATION_ENV_KEY: Record<DocumentKind, string> = {
  purchaseOrder: "B2B_VALIDATE_PURCHASE_ORDER",
  orderApproval: "B2B_VALIDATE_ORDER_APPROVAL",
  invoice: "B2B_VALIDATE_INVOICE",
  supplierOrder: "B2B_VALIDATE_SUPPLIER_ORDER",
};

// SWHR-R-0044: on unless explicitly switched off.
export function isValidationEnabled(kind: DocumentKind): boolean {
  return process.env[VALIDATION_ENV_KEY[kind]] !== "false";
}

// SWHR-R-0044.02: DTD-declared by default, or XML-Schema-declared.
export function getSchemaForm(): "dtd" | "xsd" {
  return process.env.B2B_SCHEMA_FORM?.toLowerCase() === "xsd" ? "xsd" : "dtd";
}

// SWHR-R-0048: path to a deployment-supplied entity catalog overriding the
// bundled mapping. Unset means no override.
export function getEntityCatalogPath(): string | null {
  return process.env.B2B_ENTITY_CATALOG || null;
}
