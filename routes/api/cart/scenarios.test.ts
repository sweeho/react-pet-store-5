import { H3Event } from "nitro/h3";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "../../../db/client";
import { itemDetails } from "../../../db/schema";
import type { CartView } from "../../../lib/cart/types";
import signoff from "../signoff.post";
import getCart from "./index.get";
import patchCart from "./index.patch";
import postItem from "./items.post";

/**
 * Scenario-level route integration: the real handlers, one shopper session
 * carried across requests by its cookie.
 */
class Shopper {
  private cookie = "";

  private async run(
    handler: (event: H3Event) => unknown,
    method: string,
    path: string,
    body?: unknown,
  ) {
    const event = new H3Event(
      new Request(`http://localhost${path}`, {
        method,
        headers: {
          "content-type": "application/json",
          ...(this.cookie ? { cookie: this.cookie } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
    const result = await handler(event);
    const set = event.res.headers.getSetCookie().map((entry) => entry.split(";")[0]);
    if (set.length > 0) {
      this.cookie = set.join("; ");
    }
    return result as CartView;
  }

  add(itemId: string) {
    return this.run(postItem, "POST", "/api/cart/items", { itemId });
  }
  update(quantities: Record<string, unknown>) {
    return this.run(patchCart, "PATCH", "/api/cart", { quantities });
  }
  cart() {
    return this.run(getCart, "GET", "/api/cart");
  }
  signOff() {
    return this.run(signoff, "POST", "/api/signoff");
  }
}

describe("cart scenarios over the routes", () => {
  it("[SWHR-C-0238] sign-out discards the 3-line cart and the next access sees an empty one", async () => {
    const shopper = new Shopper();
    await shopper.update({ "EST-6": 1, "EST-1": 1, "EST-7": 1 });
    expect((await shopper.cart()).count).toBe(3);

    await shopper.signOff();

    expect(await shopper.cart()).toMatchObject({ lines: [], count: 0, subtotal: 0 });
  });

  it("[SWHR-C-0248] quantity 'abc' removes EST-6 without error", async () => {
    const shopper = new Shopper();
    await shopper.add("EST-6");
    await shopper.update({ "EST-6": "2" });

    const view = await shopper.update({ "EST-6": "abc" });

    expect(view.lines).toEqual([]);
    expect((await shopper.cart()).count).toBe(0);
  });

  it("[SWHR-C-0252] the line shows the current catalog price 2000, not the price at add time", async () => {
    const shopper = new Shopper();
    await shopper.add("EST-6");
    const where = eq(itemDetails.itemId, "EST-6");
    db.update(itemDetails).set({ listPrice: 2000 }).where(where).run();
    try {
      const view = await shopper.cart();

      expect(view.lines[0]?.unitCost).toBe(2000);
      expect(view.subtotal).toBe(2000);
    } finally {
      db.update(itemDetails).set({ listPrice: 1850 }).where(where).run();
    }
  });

  it("two sessions keep separate carts", async () => {
    const a = new Shopper();
    const b = new Shopper();
    await a.add("EST-6");

    expect((await b.cart()).count).toBe(0);
    expect((await a.cart()).count).toBe(1);
  });
});
