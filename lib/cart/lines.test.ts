import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { addCartItem, deleteCartLinesForSession, getCartWithDetails, listCartLines } from "./lines";

function event(): H3Event {
  return new H3Event(new Request("http://localhost/"));
}

describe("addCartItem / listCartLines", () => {
  it("adds a new line at quantity 1", () => {
    const sessionId = crypto.randomUUID();

    addCartItem(sessionId, "item-1");

    expect(listCartLines(sessionId)).toEqual([{ itemId: "item-1", quantity: 1 }]);
  });

  it("increments the existing line instead of adding a second one", () => {
    const sessionId = crypto.randomUUID();

    addCartItem(sessionId, "item-1");
    addCartItem(sessionId, "item-1");

    expect(listCartLines(sessionId)).toEqual([{ itemId: "item-1", quantity: 2 }]);
  });

  it("keeps lines for different sessions separate", () => {
    const sessionA = crypto.randomUUID();
    const sessionB = crypto.randomUUID();

    addCartItem(sessionA, "item-1");

    expect(listCartLines(sessionB)).toEqual([]);
  });
});

describe("deleteCartLinesForSession", () => {
  it("removes every line for that session", () => {
    const sessionId = crypto.randomUUID();
    addCartItem(sessionId, "item-1");
    addCartItem(sessionId, "item-2");

    deleteCartLinesForSession(sessionId);

    expect(listCartLines(sessionId)).toEqual([]);
  });
});

describe("getCartWithDetails", () => {
  it("merges a line with its item details", async () => {
    const sessionId = crypto.randomUUID();
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
    const sessionId = crypto.randomUUID();
    addCartItem(sessionId, "does-not-exist");

    const details = await getCartWithDetails(event(), sessionId);

    expect(details).toEqual([]);
  });
});
