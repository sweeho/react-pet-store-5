import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { seedCatalog } from "../../db/seed/catalog";
import { migrateDatabase } from "./migrate";

const realFolder = path.join(process.cwd(), "drizzle");
const CATALOGUE_TABLES = [
  "category",
  "categoryDetails",
  "product",
  "productDetails",
  "item",
  "itemDetails",
] as const;

interface Journal {
  entries: { idx: number }[];
}

let tmp: string;
let dbPath: string;
let oldFolder: string;
let opened: Database[];

function open(): Database {
  const sqlite = new Database(dbPath);
  opened.push(sqlite);
  return sqlite;
}

function journalLength(): number {
  const journal = JSON.parse(
    fs.readFileSync(path.join(realFolder, "meta", "_journal.json"), "utf8"),
  ) as Journal;
  return journal.entries.length;
}

function migrationCount(sqlite: Database): number {
  const row = sqlite.query("SELECT count(*) AS n FROM __drizzle_migrations").get() as { n: number };
  return row.n;
}

function snapshot(sqlite: Database): Record<string, unknown[]> {
  return Object.fromEntries(
    CATALOGUE_TABLES.map((t) => [t, sqlite.query(`SELECT * FROM "${t}" ORDER BY rowid`).all()]),
  );
}

// Applies the migrations up to 0004 with enforcement OFF, matching what the
// app's earlier releases did, then seeds a small catalogue with plain inserts.
function migrateThrough0004(sqlite: Database): void {
  migrate(drizzle(sqlite), { migrationsFolder: oldFolder });
}

function seedRows(sqlite: Database): void {
  sqlite.exec(`
    INSERT INTO category (id) VALUES ('FISH'), ('DOGS');
    INSERT INTO categoryDetails (categoryId, locale, name, image, description)
      VALUES ('FISH', 'en_US', 'Fish', 'fish.gif', 'Fish desc'), ('DOGS', 'ja_JP', 'Dogs', NULL, NULL);
    INSERT INTO product (id, categoryId) VALUES ('FI-1', 'FISH'), ('DO-1', 'DOGS');
    INSERT INTO productDetails (productId, locale, name, image, description)
      VALUES ('FI-1', 'en_US', 'Angelfish', 'a.gif', 'Salt'), ('DO-1', 'ja_JP', 'Bulldog', NULL, NULL);
    INSERT INTO item (id, productId) VALUES ('EST-1', 'FI-1'), ('EST-2', 'DO-1');
    INSERT INTO itemDetails (itemId, locale, name, description, image, listPrice, unitCost, attr1)
      VALUES ('EST-1', 'en_US', 'Large', 'Big', 'l.gif', 1650, 1000, 'Adult'),
             ('EST-2', 'ja_JP', 'Small', 'Tiny', 's.gif', 1800, 900, NULL);
  `);
}

beforeEach(() => {
  opened = [];
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "migrate-"));
  dbPath = path.join(tmp, "test.db");
  oldFolder = path.join(tmp, "drizzle-0004");
  fs.cpSync(realFolder, oldFolder, { recursive: true });
  const journalPath = path.join(oldFolder, "meta", "_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8")) as Journal;
  journal.entries = journal.entries.filter((e) => e.idx <= 4);
  fs.writeFileSync(journalPath, JSON.stringify(journal));
});

afterEach(() => {
  for (const sqlite of opened) sqlite.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

function upgradedPopulated(): Database {
  const first = open();
  migrateThrough0004(first);
  seedRows(first);
  first.close();
  const sqlite = open();
  migrateDatabase(sqlite, realFolder);
  return sqlite;
}

describe("migrateDatabase", () => {
  it("[SWHR-C-0448] keeps every catalogue row when upgrading a 0004 database", () => {
    const first = open();
    migrateThrough0004(first);
    seedRows(first);
    const before = snapshot(first);
    first.close();

    const sqlite = open();
    expect(() => migrateDatabase(sqlite, realFolder)).not.toThrow();
    expect(migrationCount(sqlite)).toBe(journalLength());
    expect(snapshot(sqlite)).toEqual(before);
  });

  it("[SWHR-C-0449] rejects a product with an unknown category after upgrade", () => {
    const sqlite = upgradedPopulated();
    expect(() =>
      sqlite.exec("INSERT INTO product (id, categoryId) VALUES ('FI-X', 'NOSUCH')"),
    ).toThrow(/FOREIGN KEY/);
    expect(sqlite.query("SELECT id FROM product WHERE id = 'FI-X'").all()).toEqual([]);
  });

  it("[SWHR-C-0450] rejects an eleven-character category id after upgrade", () => {
    const sqlite = upgradedPopulated();
    expect(() => sqlite.exec("INSERT INTO category (id) VALUES ('ABCDEFGHIJK')")).toThrow(
      /category_id_length_check/,
    );
    expect(sqlite.query("SELECT id FROM category WHERE id = 'ABCDEFGHIJK'").all()).toEqual([]);
  });

  it("[SWHR-C-0451] stops the upgrade naming the product table on an orphan product", () => {
    const first = open();
    migrateThrough0004(first);
    first.exec("PRAGMA foreign_keys = OFF");
    first.exec("INSERT INTO product (id, categoryId) VALUES ('FI-1', 'GONE')");
    first.close();

    const sqlite = open();
    let error: unknown;
    try {
      migrateDatabase(sqlite, realFolder);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("product");
    const row = sqlite.query("PRAGMA foreign_keys").get() as { foreign_keys: number };
    expect(row.foreign_keys).toBe(1);
  });

  it("[SWHR-C-0452] creates, migrates and seeds a missing database file", () => {
    expect(fs.existsSync(dbPath)).toBe(false);
    const sqlite = open();
    migrateDatabase(sqlite, realFolder);
    seedCatalog(drizzle(sqlite));
    expect(migrationCount(sqlite)).toBe(journalLength());
    const row = sqlite.query("SELECT count(*) AS n FROM category").get() as { n: number };
    expect(row.n).toBeGreaterThan(0);
    expect(sqlite.query("PRAGMA foreign_key_check").all()).toEqual([]);
  });
});
