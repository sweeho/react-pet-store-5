import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { validateXML } from "xmllint-wasm";

import { resolveEntity } from "./resolver";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// cwd-relative, matching db/client.ts: Vite/Nitro/Vitest all transform
// this module, so its import.meta.url isn't a real file:// URL.
const SCHEMAS_DIR = path.join(process.cwd(), "lib/b2b/schemas/files");

/**
 * Validates `xml` against the schema resolved for `schemaKey` (a public
 * identifier or a namespace — resolveEntity's `publicId`). SWHR-R-0046/
 * SD-9: this never throws for a schema violation, or for a schema that
 * cannot be resolved or loaded — an unavailable schema degrades to "no
 * violation reported" rather than blocking the caller, matching
 * SWHR-R-0048's "fall back to default resolution rather than fail".
 */
export async function validateDocument(xml: string, schemaKey: string): Promise<ValidationResult> {
  const resolved = resolveEntity(schemaKey, null);
  if (!resolved) {
    return { valid: true, errors: [] };
  }

  const schemaPath = localSchemaPath(resolved.location);
  if (!schemaPath || !existsSync(schemaPath)) {
    return { valid: true, errors: [] };
  }

  let schemaSource: string;
  try {
    schemaSource = readFileSync(schemaPath, "utf-8");
  } catch {
    return { valid: true, errors: [] };
  }

  try {
    const result = await validateXML({
      xml: { fileName: "document.xml", contents: xml },
      schema: { fileName: path.basename(schemaPath), contents: schemaSource },
      preload: preloadSiblingSchemas(schemaPath),
    });
    return { valid: result.valid, errors: result.errors.map((error) => error.message) };
  } catch {
    return { valid: true, errors: [] };
  }
}

// A resolved location is either a bundled filename (from the catalog) or a
// raw document/deployment-catalog location (SWHR-R-0048 steps 2-3); both
// are only usable here when they name a file directly under the bundled
// schemas directory.
function localSchemaPath(location: string): string | null {
  const base = path.basename(location);
  if (!base || base === "." || base === "..") {
    return null;
  }
  return path.join(SCHEMAS_DIR, base);
}

// Lets a schema's xsd:include/import reference a sibling bundled schema by
// filename without this function needing to know the include graph.
function preloadSiblingSchemas(schemaPath: string): { fileName: string; contents: string }[] {
  const primary = path.basename(schemaPath);
  let entries: string[];
  try {
    entries = readdirSync(SCHEMAS_DIR);
  } catch {
    return [];
  }

  const preload: { fileName: string; contents: string }[] = [];
  for (const fileName of entries) {
    if (fileName === primary || !/\.(xsd|dtd)$/i.test(fileName)) {
      continue;
    }
    try {
      preload.push({ fileName, contents: readFileSync(path.join(SCHEMAS_DIR, fileName), "utf-8") });
    } catch {
      // Skip unreadable siblings (e.g. a stray non-file entry) — best-effort.
    }
  }
  return preload;
}
