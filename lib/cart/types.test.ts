import { describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { sessions } from "../../db/schema";
import { addCartItem, listCartLines } from "./lines";
import { emptyCartView } from "./types";

function createSession(): string {
  const id = crypto.randomUUID();
  db.insert(sessions)
    .values({
      id,
      realm: "storefront",
      signedOn: false,
      lastSeenAt: new Date(),
      createdAt: new Date(),
    })
    .run();
  return id;
}

describe("cart per session", () => {
  it("[SWHR-C-0237] a first cart access in a new session yields an empty cart", () => {
    const sessionId = createSession();

    expect(listCartLines(sessionId)).toEqual([]);
    expect(emptyCartView("en-US")).toEqual({
      lines: [],
      count: 0,
      subtotal: 0,
      locale: "en-US",
    });
  });

  it("[SWHR-C-0239] session A's EST-6 does not appear in session B's cart", () => {
    const sessionA = createSession();
    const sessionB = createSession();

    addCartItem(sessionA, "EST-6");

    expect(listCartLines(sessionA)).toEqual([{ itemId: "EST-6", quantity: 1 }]);
    expect(listCartLines(sessionB).map((line) => line.itemId)).not.toContain("EST-6");
    expect(emptyCartView("en-US").count).toBe(0);
  });
});
