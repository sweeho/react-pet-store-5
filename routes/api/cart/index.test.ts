import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import { addCartItem } from "../../../lib/cart/lines";
import { getAuthSession } from "../../../lib/auth/session";
import getCart from "./index.get";

describe("GET /api/cart", () => {
  it("is served to an anonymous shopper with an empty CartView", async () => {
    const event = new H3Event(new Request("http://localhost/api/cart"));

    await expect(getCart(event)).resolves.toEqual({
      lines: [],
      count: 0,
      subtotal: 0,
      locale: "en_US",
    });
  });

  it("lists an item already in the anonymous session's cart as a flat CartLine", async () => {
    const event = new H3Event(new Request("http://localhost/api/cart"));
    const session = await getAuthSession(event, "storefront");
    addCartItem(session.id, "EST-6");

    const result = await getCart(event);

    expect(result.count).toBe(1);
    expect(result.lines).toEqual([
      expect.objectContaining({
        itemId: "EST-6",
        quantity: 1,
        unitCost: expect.any(Number),
        lineTotal: expect.any(Number),
      }),
    ]);
    expect(result.subtotal).toBe(result.lines[0]?.lineTotal);
  });
});
