import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { item, sessions } from "../../db/schema";
import { addCartItem, deleteCartLinesForSession, getCartWithDetails, listCartLines } from "./lines";

function event(): H3Event {
  return new H3Event(new Request("http://localhost/"));
}

// cartLines.sessionId references sessions.id (FK now enforced) — a cart
// line needs a real session row to attach to.
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

describe("addCartItem / listCartLines", () => {
  it("adds a new line at quantity 1", () => {
    const sessionId = createSession();

    addCartItem(sessionId, "EST-6");

    expect(listCartLines(sessionId)).toEqual([{ itemId: "EST-6", quantity: 1 }]);
  });

  it("increments the existing line instead of adding a second one", () => {
    const sessionId = createSession();

    addCartItem(sessionId, "EST-6");
    addCartItem(sessionId, "EST-6");

    expect(listCartLines(sessionId)).toEqual([{ itemId: "EST-6", quantity: 2 }]);
  });

  it("keeps lines for different sessions separate", () => {
    const sessionA = createSession();
    const sessionB = createSession();

    addCartItem(sessionA, "EST-6");

    expect(listCartLines(sessionB)).toEqual([]);
  });
});

describe("deleteCartLinesForSession", () => {
  it("removes every line for that session", () => {
    const sessionId = createSession();
    addCartItem(sessionId, "EST-6");
    addCartItem(sessionId, "EST-7");

    deleteCartLinesForSession(sessionId);

    expect(listCartLines(sessionId)).toEqual([]);
  });
});

describe("getCartWithDetails", () => {
  it("merges a line with its item details", async () => {
    const sessionId = createSession();
    addCartItem(sessionId, "EST-6");

    const details = await getCartWithDetails(event(), sessionId);

    expect(details).toEqual([
      expect.objectContaining({
        itemId: "EST-6",
        quantity: 1,
        item: expect.objectContaining({ itemId: "EST-6", name: "Male Adult Bulldog" }),
      }),
    ]);
  });

  it("drops a line whose item doesn't resolve", async () => {
    const sessionId = createSession();
    // item.id must exist for the FK on cartLines.itemId, but this item has
    // no itemDetails row at all, so getItem's inner join never resolves it
    // in any locale — exactly the "doesn't resolve" case this test pins.
    db.insert(item).values({ id: "GHOST-ITEM", productId: "BULLDOG" }).run();
    addCartItem(sessionId, "GHOST-ITEM");

    const details = await getCartWithDetails(event(), sessionId);

    expect(details).toEqual([]);
  });
});
