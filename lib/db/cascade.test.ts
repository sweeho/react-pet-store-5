import path from "node:path";

import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { migrateDatabase } from "./migrate";

let sqlite: Database;

function count(table: string): number {
  return (sqlite.query(`SELECT count(*) AS n FROM "${table}"`).get() as { n: number }).n;
}

beforeEach(() => {
  sqlite = new Database(":memory:");
  migrateDatabase(sqlite, path.join(process.cwd(), "drizzle"));
});

afterEach(() => sqlite.close());

describe("deleting an order header", () => {
  it("[SWHR-C-0346] removes its contact, address, card and three lines", () => {
    sqlite.exec(`
      INSERT INTO purchaseOrders (orderId, userId, emailId, orderDate, locale, totalValue, createdAt)
        VALUES ('10001', 'u', 'a@b.c', 0, 'en_US', 100, 0);
      INSERT INTO orderContacts (id, orderId, givenName, familyName, telephone)
        VALUES (1, '10001', 'A', 'B', '555');
      INSERT INTO orderAddresses (id, contactId, streetName1, city, state, zipCode, country)
        VALUES (1, 1, '1 Main', 'X', 'CA', '94303', 'US');
      INSERT INTO orderCards (id, orderId, cardNumber, cardType, expiryDate)
        VALUES (1, '10001', '4111', 'Visa', '03/2030');
      INSERT INTO orderLines (orderId, lineNum, categoryId, productId, itemId, quantity, unitPrice)
        VALUES ('10001', 0, 'FISH', 'FI-1', 'EST-1', 1, 10),
               ('10001', 1, 'FISH', 'FI-1', 'EST-2', 1, 10),
               ('10001', 2, 'FISH', 'FI-1', 'EST-3', 1, 10);
    `);

    const columns = sqlite.query("PRAGMA table_info(orderLines)").all() as { name: string }[];
    expect(columns.map((c) => c.name)).toContain("quantityShipped");

    sqlite.exec("DELETE FROM purchaseOrders WHERE orderId = '10001'");

    for (const t of ["orderContacts", "orderAddresses", "orderCards", "orderLines"]) {
      expect(count(t), t).toBe(0);
    }
  });
});

describe("deleting a supplier order header", () => {
  it("[SWHR-C-0376] removes its contact, address and lines", () => {
    sqlite.exec(`
      INSERT INTO supplierOrders (orderId, orderDate, createdAt) VALUES ('S1', 0, 0);
      INSERT INTO supplierContacts (orderId, familyName, givenName, email, phone)
        VALUES ('S1', 'B', 'A', 'a@b.c', '555');
      INSERT INTO supplierAddresses (orderId, streetName1, city, state, zipCode, country)
        VALUES ('S1', '1 Main', 'X', 'CA', '94303', 'US');
      INSERT INTO supplierLineItems (orderId, categoryId, productId, itemId, lineNum, quantity, unitPrice)
        VALUES ('S1', 'FISH', 'FI-1', 'EST-1', 0, 1, 10), ('S1', 'FISH', 'FI-1', 'EST-2', 1, 2, 10);
    `);

    // A restricting foreign key makes this throw; the row counts below then fail the test.
    try {
      sqlite.exec("DELETE FROM supplierOrders WHERE orderId = 'S1'");
    } catch {
      /* asserted through the remaining rows */
    }

    for (const t of ["supplierContacts", "supplierAddresses", "supplierLineItems"]) {
      expect(count(t), t).toBe(0);
    }
  });
});
