import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import postItems from "../items.post";
import deleteItem from "./[itemId].delete";

function cookieOf(event: H3Event): string {
  return event.res.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
}

describe("DELETE /api/cart/items/:itemId", () => {
  it("removes the line and answers the CartView", async () => {
    const add = new H3Event(
      new Request("http://localhost/api/cart/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: "EST-6" }),
      }),
    );
    await postItems(add);
    const event = new H3Event(
      new Request("http://localhost/api/cart/items/EST-6", {
        method: "DELETE",
        headers: { cookie: cookieOf(add) },
      }),
      { params: { itemId: "EST-6" } },
    );

    const result = await deleteItem(event);

    expect(result).toMatchObject({ lines: [], count: 0, subtotal: 0 });
  });

  it("answers 200 with the CartView when the item is absent", async () => {
    const event = new H3Event(
      new Request("http://localhost/api/cart/items/EST-6", { method: "DELETE" }),
      { params: { itemId: "EST-6" } },
    );

    await expect(deleteItem(event)).resolves.toMatchObject({ count: 0 });
  });
});
