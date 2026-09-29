import type { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

// Drizzle runs every pending migration in one transaction, where SQLite
// ignores a migration file's own `PRAGMA foreign_keys=OFF`. A table rebuild
// (0005, 0006) that drops a parent table would then fail on an existing
// database, so enforcement must be OFF before `migrate` starts. It is turned
// back ON afterwards and the result checked, since the rebuilds ran unenforced.
export function migrateDatabase(sqlite: Database, migrationsFolder: string): void {
  sqlite.exec("PRAGMA foreign_keys = OFF");
  try {
    migrate(drizzle(sqlite), { migrationsFolder });
  } finally {
    sqlite.exec("PRAGMA foreign_keys = ON");
  }

  const violations = sqlite.query("PRAGMA foreign_key_check").all() as { table: string }[];
  if (violations.length > 0) {
    const tables = [...new Set(violations.map((v) => v.table))].join(", ");
    throw new Error(`Foreign key check failed after migration; offending tables: ${tables}`);
  }
}
