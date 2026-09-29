import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { db } from "../../db/client";
import { counters } from "../../db/schema";
import * as schema from "../../db/schema";
import { migrateDatabase } from "../db/migrate";
import type { Executor } from "../account/types";
import { CounterCreationError, ORDER_ID_PREFIX, nextId } from "./counter";

function counterValue(prefix: string): number | undefined {
  return db.select().from(counters).where(eq(counters.name, prefix)).get()?.value;
}

beforeEach(() => {
  db.delete(counters).run();
});

describe("nextId", () => {
  test("[SWHR-C-0274] first three orders receive ids 10011, 10012, 10013", () => {
    expect([nextId(ORDER_ID_PREFIX), nextId(ORDER_ID_PREFIX), nextId(ORDER_ID_PREFIX)]).toEqual([
      "10011",
      "10012",
      "10013",
    ]);
  });

  test("[SWHR-C-0275] counter at 7 for 1001 returns 10018 and holds 8", () => {
    db.insert(counters).values({ name: "1001", value: 7 }).run();
    expect(nextId("1001")).toBe("10018");
    expect(counterValue("1001")).toBe(8);
  });

  test("[SWHR-C-0276] new prefix 2002 creates a counter and returns 20021", () => {
    expect(nextId("2002")).toBe("20021");
    expect(counterValue("2002")).toBe(1);
  });

  test("[SWHR-C-0277] counter creation failure for 2002 raises an error naming 2002", () => {
    const attempt = () =>
      db.transaction((tx) => {
        vi.spyOn(tx, "insert").mockImplementation(() => {
          throw new Error("disk full");
        });
        return nextId("2002", tx);
      });
    expect(attempt).toThrow(CounterCreationError);
    expect(attempt).toThrow(/2002/);
  });

  test("[SWHR-C-0278] two concurrent requests at counter 20 receive 100121 and 100122", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "ids-"));
    const file = path.join(dir, "ids.db");
    const a = new Database(file);
    const b = new Database(file);
    try {
      a.exec("PRAGMA busy_timeout = 5000");
      b.exec("PRAGMA busy_timeout = 5000");
      migrateDatabase(a, path.join(process.cwd(), "drizzle"));
      const dbA = drizzle(a, { schema });
      const dbB = drizzle(b, { schema });
      dbA.insert(counters).values({ name: "1001", value: 20 }).run();

      const issue = async (conn: typeof dbA) =>
        conn.transaction((tx) => nextId("1001", tx as unknown as Executor), {
          behavior: "immediate",
        });
      const results = await Promise.all([issue(dbA), issue(dbB)]);

      expect([...results].sort()).toEqual(["100121", "100122"]);
      expect(dbA.select().from(counters).where(eq(counters.name, "1001")).get()?.value).toBe(22);
    } finally {
      a.close();
      b.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("[SWHR-C-0279] counter increment is rolled back with the caller's transaction", () => {
    db.insert(counters).values({ name: "1001", value: 5 }).run();
    let issued: string | undefined;
    expect(() =>
      db.transaction((tx) => {
        issued = nextId("1001", tx);
        tx.rollback();
      }),
    ).toThrow();
    expect(issued).toBe("10016");
    expect(counterValue("1001")).toBe(5);
  });
});
