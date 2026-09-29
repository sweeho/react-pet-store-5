/**
 * Wraps a catalog store failure (design.md P2, SWHR-R-0098): every exported
 * query in queries.ts catches a store failure and rethrows it as this type,
 * carrying the underlying message, with no retry.
 */
export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogError";
  }
}

export function toCatalogError(error: unknown): CatalogError {
  void error;
  throw new Error("VortexNotImplemented");
}
