import { eq } from "drizzle-orm";
import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { item, itemDetails, sessions } from "../../db/schema";
import { endAuthSession, getAuthSession } from "../auth/session";
import {
  addCartItem,
  countCartLines,
  deleteCartLinesForSession,
  emptyCart,
  getCart,
  listCartLines,
  parseQuantity,
  removeCartItem,
  updateCartQuantities,
} from "./lines";

function event(): H3Event {
  return new H3Event(new Request("http://localhost/"));
}

// cartLines.sessionId references sessions.id (FK enforced) — a cart
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

function quantities(sessionId: string): Record<string, number> {
  return Object.fromEntries(listCartLines(sessionId).map((l) => [l.itemId, l.quantity]));
}

function cartWith(entries: Record<string, number>): string {
  const sessionId = createSession();
  updateCartQuantities(sessionId, entries);
  return sessionId;
}

describe("addCartItem", () => {
  it("[SWHR-C-0241] adding EST-6 to a cart without it creates one line of quantity 1", () => {
    const sessionId = createSession();

    expect(addCartItem(sessionId, "EST-6")).toBe(true);

    expect(listCartLines(sessionId)).toEqual([{ itemId: "EST-6", quantity: 1 }]);
  });

  it("[SWHR-C-0242] adding EST-6 again resets its quantity from 4 to 1", () => {
    const sessionId = cartWith({ "EST-6": 4 });

    addCartItem(sessionId, "EST-6");

    expect(listCartLines(sessionId)).toEqual([{ itemId: "EST-6", quantity: 1 }]);
  });

  it("returns false and stores nothing for an item id not in the catalog", () => {
    const sessionId = createSession();

    expect(addCartItem(sessionId, "EST-99")).toBe(false);

    expect(listCartLines(sessionId)).toEqual([]);
  });

  it("keeps lines for different sessions separate", () => {
    const sessionA = createSession();
    const sessionB = createSession();

    addCartItem(sessionA, "EST-6");

    expect(listCartLines(sessionB)).toEqual([]);
  });
});

describe("removeCartItem", () => {
  it("[SWHR-C-0243] removing EST-6 leaves only EST-1", () => {
    const sessionId = cartWith({ "EST-6": 1, "EST-1": 1 });

    removeCartItem(sessionId, "EST-6");

    expect(quantities(sessionId)).toEqual({ "EST-1": 1 });
  });

  it("[SWHR-C-0244] removing absent EST-6 is a no-op without error", () => {
    const sessionId = cartWith({ "EST-1": 1 });

    expect(() => removeCartItem(sessionId, "EST-6")).not.toThrow();

    expect(quantities(sessionId)).toEqual({ "EST-1": 1 });
  });
});

describe("updateCartQuantities", () => {
  it("[SWHR-C-0245] update sets EST-6 from 1 to 3", () => {
    const sessionId = cartWith({ "EST-6": 1 });

    updateCartQuantities(sessionId, { "EST-6": 3 });

    expect(quantities(sessionId)).toEqual({ "EST-6": 3 });
  });

  it("[SWHR-C-0246] update with 0 and -2 removes both lines", () => {
    const sessionId = cartWith({ "EST-6": 2, "EST-1": 1 });

    updateCartQuantities(sessionId, { "EST-6": 0, "EST-1": -2 });

    expect(listCartLines(sessionId)).toEqual([]);
  });

  it("[SWHR-C-0247] update with positive quantity for absent EST-1 adds it", () => {
    const sessionId = createSession();

    updateCartQuantities(sessionId, { "EST-1": 2 });

    expect(quantities(sessionId)).toEqual({ "EST-1": 2 });
  });

  it("[SWHR-C-0248] quantity 'abc' removes EST-6 without error", () => {
    const sessionId = cartWith({ "EST-6": 2 });

    expect(() => updateCartQuantities(sessionId, { "EST-6": "abc" })).not.toThrow();

    expect(listCartLines(sessionId)).toEqual([]);
  });

  it("[SWHR-C-0249] quantity '1.5' removes EST-6", () => {
    const sessionId = cartWith({ "EST-6": 2 });

    updateCartQuantities(sessionId, { "EST-6": "1.5" });

    expect(listCartLines(sessionId)).toEqual([]);
  });

  it("ignores an entry whose id is not in the catalog", () => {
    const sessionId = cartWith({ "EST-6": 1 });

    expect(() => updateCartQuantities(sessionId, { "EST-99": 2, "EST-6": 2 })).not.toThrow();

    expect(quantities(sessionId)).toEqual({ "EST-6": 2 });
  });
});

describe("parseQuantity", () => {
  it.each([
    ["3", 3],
    ["-2", -2],
    [4, 4],
    ["abc", 0],
    ["1.5", 0],
    ["", 0],
    [" 3", 0],
    [1.5, 0],
    [null, 0],
    ["2147483648", 0],
    ["-2147483649", 0],
  ])("parses %j as %j", (input, expected) => {
    expect(parseQuantity(input)).toBe(expected);
  });
});

describe("countCartLines", () => {
  it("[SWHR-C-0250] item count of EST-6 x3 and EST-1 x2 is 2", () => {
    const sessionId = cartWith({ "EST-6": 3, "EST-1": 2 });

    expect(countCartLines(sessionId)).toBe(2);
  });
});

describe("getCart", () => {
  it("[SWHR-C-0251] EST-6 x3 at 18.50 line carries details and total 55.50", async () => {
    const sessionId = cartWith({ "EST-6": 3 });

    const cart = await getCart(event(), sessionId);

    expect(cart.locale).toBe("en_US");
    expect(cart.lines).toEqual([
      expect.objectContaining({
        itemId: "EST-6",
        productId: "K9-BD-01",
        categoryId: "DOGS",
        productName: expect.any(String),
        name: "Male Adult Bulldog",
        quantity: 3,
        unitCost: 1850,
        lineTotal: 5550,
      }),
    ]);
    expect(cart.lines[0]).toHaveProperty("attribute");
  });

  it("[SWHR-C-0252] cart line shows the current catalog price 20.00, not the price at add time", async () => {
    const sessionId = cartWith({ "EST-6": 1 });
    const where = eq(itemDetails.itemId, "EST-6");
    db.update(itemDetails).set({ listPrice: 2000 }).where(where).run();
    try {
      const cart = await getCart(event(), sessionId);

      expect(cart.lines[0]?.unitCost).toBe(2000);
    } finally {
      db.update(itemDetails).set({ listPrice: 1850 }).where(where).run();
    }
  });

  it("[SWHR-C-0253] unresolvable EST-99 is skipped in listing and subtotal but counted", async () => {
    // cartLines.itemId is a foreign key to item.id, so "cannot be resolved"
    // is an item with no itemDetails in the cart locale (P6, SD-3).
    db.insert(item).values({ id: "GHOST-ITEM", productId: "K9-BD-01" }).run();
    const sessionId = cartWith({ "EST-6": 1, "GHOST-ITEM": 1 });

    const cart = await getCart(event(), sessionId);

    expect(cart.lines.map((l) => l.itemId)).toEqual(["EST-6"]);
    expect(cart.subtotal).toBe(1850);
    expect(cart.count).toBe(2);
  });

  it("[SWHR-C-0254] subtotal of EST-6 x2 at 18.50 and EST-1 x1 at 16.50 is 53.50", async () => {
    const sessionId = cartWith({ "EST-6": 2, "EST-1": 1 });

    const cart = await getCart(event(), sessionId);

    expect(cart.subtotal).toBe(5350);
  });

  it("[SWHR-C-0255] subtotal of an empty cart is 0", async () => {
    const cart = await getCart(event(), createSession());

    expect(cart).toEqual({ lines: [], count: 0, subtotal: 0, locale: "en_US" });
  });

  it("orders lines by when they were added, and a re-add keeps its position", async () => {
    const sessionId = createSession();
    addCartItem(sessionId, "EST-6");
    addCartItem(sessionId, "EST-1");
    addCartItem(sessionId, "EST-6");

    const cart = await getCart(event(), sessionId);

    expect(cart.lines.map((l) => l.itemId)).toEqual(["EST-6", "EST-1"]);
  });
});

describe("emptyCart / sign-out", () => {
  it("[SWHR-C-0256] placing an order empties a 3-line cart", async () => {
    const sessionId = cartWith({ "EST-6": 1, "EST-1": 1, "EST-7": 1 });
    expect(countCartLines(sessionId)).toBe(3);

    emptyCart(sessionId);

    expect((await getCart(event(), sessionId)).lines).toEqual([]);
    expect(countCartLines(sessionId)).toBe(0);
  });

  it("[SWHR-C-0238] sign-out discards the 3-line cart", async () => {
    const first = event();
    const original = await getAuthSession(first, "storefront");
    updateCartQuantities(original.id, { "EST-6": 1, "EST-1": 1, "EST-7": 1 });
    expect(countCartLines(original.id)).toBe(3);

    await endAuthSession(first, "storefront");

    const cookie = first.res.headers
      .getSetCookie()
      .map((entry) => entry.split(";")[0])
      .join("; ");
    const second = new H3Event(new Request("http://localhost/", { headers: { cookie } }));
    const fresh = await getAuthSession(second, "storefront");
    expect((await getCart(second, fresh.id)).lines).toEqual([]);
    expect(countCartLines(original.id)).toBe(0);
  });

  it("deleteCartLinesForSession removes every line for that session", () => {
    const sessionId = cartWith({ "EST-6": 1, "EST-7": 1 });

    deleteCartLinesForSession(sessionId);

    expect(listCartLines(sessionId)).toEqual([]);
  });
});
