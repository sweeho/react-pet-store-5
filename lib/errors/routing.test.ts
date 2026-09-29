import { H3Event } from "nitro/h3";
import { describe, expect, it } from "vitest";

import {
  DuplicateAccountFailure,
  EmptyCartFailure,
  Failure,
  MissingFormDataFailure,
} from "./failures";
import { failureResponse } from "./routing";

class UnmappedTestFailure extends Failure {
  override readonly kind = "UnmappedTestFailure";
}

// A route handler that raises and answers the way the order route will.
function handler(raise: () => never) {
  return (event: H3Event) => {
    try {
      raise();
    } catch (error) {
      const { status, body } = failureResponse(error);
      return new Response(JSON.stringify(body), {
        status,
        headers: { "x-path": event.url.pathname },
      });
    }
  };
}

describe("failure routing", () => {
  it("[SWHR-C-0284] an empty-cart failure maps to the Order Error screen", () => {
    const res = failureResponse(new EmptyCartFailure());
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ kind: "EmptyCart", screen: "/order-error" });
  });

  it("[SWHR-C-0285] an unmapped failure answers a generic 500 naming the kind", async () => {
    const event = new H3Event(new Request("http://localhost/api/test"));
    const res = handler(() => {
      throw new UnmappedTestFailure();
    })(event);
    expect(res?.status).toBe(500);
    expect(res?.headers.get("x-path")).toBe("/api/test");
    const body = await res?.json();
    expect(body.screen).toBeNull();
    expect(body.message).toBe("Unhandled failure: UnmappedTestFailure");
  });

  it("covers a subtype by its parent's entry", () => {
    const res = failureResponse(new MissingFormDataFailure(["shipping.telephone"]));
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      kind: "MissingFormData",
      screen: "/error",
      missing: ["shipping.telephone"],
    });
  });

  it("maps a duplicate account to /user-creation-error", () => {
    const res = failureResponse(new DuplicateAccountFailure());
    expect(res.status).toBe(409);
    expect(res.body.screen).toBe("/user-creation-error");
  });

  it("names the error class for a plain unmapped error", () => {
    expect(failureResponse(new TypeError("x")).body.message).toBe("Unhandled failure: TypeError");
  });
});
