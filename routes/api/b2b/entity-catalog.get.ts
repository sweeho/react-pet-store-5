import { defineHandler, setResponseHeader } from "nitro/h3";

import { BUNDLED_SCHEMA_CATALOG } from "../../../lib/b2b/schemas/catalog";

/**
 * Publishes the identifier-to-schema-file mappings so trading partners can
 * resolve TPA-LineItem, TPA-SupplierOrder and TPA-Invoice locally
 * (SWHR-R-0048), the same role the legacy EntityCatalog.jsp served —
 * a `.properties`-style `identifier=location` line per document type.
 */
export default defineHandler((event) => {
  setResponseHeader(event, "content-type", "text/plain; charset=utf-8");

  return (
    BUNDLED_SCHEMA_CATALOG.map(
      (entry) => `${entry.identifier}=/api/b2b/schemas/${entry.file}`,
    ).join("\n") + "\n"
  );
});
