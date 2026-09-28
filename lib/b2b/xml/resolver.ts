import { readFileSync } from "node:fs";

import { getEntityCatalogPath } from "../config";
import { lookupBundledSchemaFile } from "../schemas/catalog";

export interface ResolvedEntity {
  location: string;
  source: "resolver" | "catalog" | "system";
}

export type EntityResolver = (
  publicId: string | null,
  systemId: string | null,
) => ResolvedEntity | null;

/**
 * SWHR-R-0048's four-step resolution order: a caller-supplied resolver;
 * the entity catalog mapping of the identifier (a deployment catalog
 * overrides the bundled one); the document's own system location.
 * `null` means none of those resolved — the caller falls back to default
 * resolution rather than fail (SWHR-R-0048, SD-9: this must never throw).
 */
export function resolveEntity(
  publicId: string | null,
  systemId: string | null,
  opts?: { resolver?: EntityResolver },
): ResolvedEntity | null {
  if (opts?.resolver) {
    const resolved = opts.resolver(publicId, systemId);
    if (resolved) {
      return resolved;
    }
  }

  if (publicId) {
    const deploymentLocation = lookupDeploymentCatalog(publicId);
    if (deploymentLocation) {
      return { location: deploymentLocation, source: "catalog" };
    }

    const bundledFile = lookupBundledSchemaFile(publicId);
    if (bundledFile) {
      return { location: bundledFile, source: "catalog" };
    }
  }

  if (systemId) {
    return { location: systemId, source: "system" };
  }

  return null;
}

// A deployment catalog is a `.properties`-style `publicId=location` file
// (design.md P7/step 5), read fresh on every lookup — this configuration
// changes only between deployments or test cases, never within a request.
function lookupDeploymentCatalog(publicId: string): string | null {
  const catalogPath = getEntityCatalogPath();
  if (!catalogPath) {
    return null;
  }

  let contents: string;
  try {
    contents = readFileSync(catalogPath, "utf-8");
  } catch {
    return null;
  }

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    if (key === publicId) {
      return trimmed.slice(separator + 1).trim();
    }
  }

  return null;
}
