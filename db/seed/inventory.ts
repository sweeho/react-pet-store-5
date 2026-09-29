import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

/** Initial stock load (stub). */
export function loadInitialStock<TSchema extends Record<string, unknown>>(
  db: BunSQLiteDatabase<TSchema>,
  options: { force?: boolean } = {},
): "loaded" | "skipped" {
  void db;
  void options;
  throw new Error("VortexNotImplemented");
}
