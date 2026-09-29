import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import patchCart from "./index.patch";

function patchRequest(body: unknown): Request {
  return new Request("http://localhost/api/cart", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/cart", () => {
  it("sets quantities in one request and answers the CartView", async () => {
    const event = new H3Event(patchRequest({ quantities: { "EST-6": "3" } }));

    const result = await patchCart(event);

    expect(result.count).toBe(1);
    expect(result.lines).toEqual([expect.objectContaining({ itemId: "EST-6", quantity: 3 })]);
  });

  it("answers 400 when quantities is not an object", async () => {
    const event = new H3Event(patchRequest({ quantities: "nope" }));

    await expect(patchCart(event)).rejects.toMatchObject({ status: 400 });
  });
});
