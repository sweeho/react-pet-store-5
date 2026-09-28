import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import postItems from "./items.post";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/cart/items", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/cart/items", () => {
  // Complements the e2e case SWHR-C-0130 (SWHR-T-0048) at the API level:
  // SWHR-R-0070 requires no sign-on for any cart operation, and this route
  // never calls the gate.
  it("adds an item for an anonymous session with no sign-on requested", async () => {
    const event = new H3Event(postRequest({ itemId: "EST-6" }));

    const result = await postItems(event);

    expect(result.lines).toEqual([expect.objectContaining({ itemId: "EST-6", quantity: 1 })]);
  });

  it("increments the quantity when the same item is added twice", async () => {
    const first = new H3Event(postRequest({ itemId: "EST-6" }));
    await postItems(first);

    const cookie = first.res.headers
      .getSetCookie()
      .map((entry) => entry.split(";")[0])
      .join("; ");
    const second = new H3Event(
      new Request("http://localhost/api/cart/items", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ itemId: "EST-6" }),
      }),
    );

    const result = await postItems(second);

    expect(result.lines).toEqual([expect.objectContaining({ itemId: "EST-6", quantity: 2 })]);
  });

  it("rejects a request with no itemId", async () => {
    const event = new H3Event(postRequest({}));

    await expect(postItems(event)).rejects.toMatchObject({ status: 400 });
  });
});
