import path from "node:path";

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { category, groupMembers, profiles, roleAssignments, users } from "./schema";
import { seedCatalog } from "./seed/catalog";

// Vitest sets VITEST=true in every worker; an in-memory db keeps route
// integration tests isolated from the file-backed dev/prod db and from
// each other (each test module gets its own fresh Database instance).
// Paths are cwd-relative rather than import.meta.url-relative because Vite
// (dev server, Nitro build, Vitest) transforms this module, so its
// import.meta.url isn't a real file:// URL — cwd is always the project root
// across dev/build/test. Outside Vitest the path is SQLITE_PATH when set
// (design.md P14 — Playwright gives itself a fresh database per run),
// defaulting to sqlite.db in the working directory.
const sqlite = new Database(
  process.env.VITEST
    ? ":memory:"
    : (process.env.SQLITE_PATH ?? path.join(process.cwd(), "sqlite.db")),
);

export const db = drizzle(sqlite, { schema: { users, profiles } });

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

// Sign-on (design.md P10, SD-8): staff seeds are development data only —
// production has no seeded staff user, so provisioning is an operator step
// (SWHR-T-0049). The passwords are the user id itself, the same demo-data
// convention the legacy app used (j2ee/j2ee) — never used outside dev/test.
if (process.env.NODE_ENV !== "production" && db.select().from(users).all().length === 0) {
  db.insert(users)
    .values([
      { userId: "jps_admin", passwordHash: Bun.password.hashSync("jps_admin") },
      { userId: "supplier", passwordHash: Bun.password.hashSync("supplier") },
      { userId: "admin_member", passwordHash: Bun.password.hashSync("admin_member") },
    ])
    .run();

  db.insert(roleAssignments)
    .values([
      { realm: "admin", role: "administrator", principalType: "user", principal: "jps_admin" },
      {
        realm: "admin",
        role: "administrator",
        principalType: "group",
        principal: "administrator_group",
      },
      { realm: "supplier", role: "administrator", principalType: "user", principal: "supplier" },
      {
        realm: "supplier",
        role: "administrator",
        principalType: "group",
        principal: "administrator_group",
      },
    ])
    .run();

  db.insert(groupMembers)
    .values([{ groupName: "administrator_group", userId: "admin_member" }])
    .run();
}

// Locale-keyed catalog data (design D4, P4), seeded once per fresh database.
if (db.select().from(category).all().length === 0) {
  seedCatalog(db);
}
