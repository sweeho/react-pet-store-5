import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createError, defineHandler, getRouterParam, setResponseHeader } from "nitro/h3";

import { BUNDLED_SCHEMA_CATALOG } from "../../../../lib/b2b/schemas/catalog";

const SCHEMAS_DIR = path.join(process.cwd(), "lib/b2b/schemas/files");

/**
 * Serves a bundled schema file named in the entity catalog (design.md P8).
 * A requested name not present in `BUNDLED_SCHEMA_CATALOG` 404s before any
 * filesystem access happens at all — the catalog is a fixed whitelist, so
 * this can't be walked outside `lib/b2b/schemas/files/` regardless of what
 * `:file` contains (a `../`-laden value simply won't equal any listed
 * filename).
 */
export default defineHandler((event) => {
  const file = getRouterParam(event, "file");
  const known = file && BUNDLED_SCHEMA_CATALOG.some((entry) => entry.file === file);
  if (!known) {
    throw createError({ statusCode: 404, statusMessage: "Schema not found" });
  }

  const schemaPath = path.join(SCHEMAS_DIR, file);
  if (!existsSync(schemaPath)) {
    throw createError({ statusCode: 404, statusMessage: "Schema not found" });
  }

  setResponseHeader(event, "content-type", "application/xml; charset=utf-8");
  return readFileSync(schemaPath, "utf-8");
});
