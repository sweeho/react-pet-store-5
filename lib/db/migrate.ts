import type { Database } from "bun:sqlite";

export function migrateDatabase(sqlite: Database, migrationsFolder: string): void {
  void sqlite;
  void migrationsFolder;
  throw new Error("VortexNotImplemented");
}
