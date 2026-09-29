import { describe, expect, it } from "vitest";

import { getConsumer } from "../lib/messaging/outbox";
import plugin from "./order-fulfillment";

const fakeNitroApp = {} as Parameters<typeof plugin>[0];

describe("order-fulfillment plugin", () => {
  it("registers the order-fulfillment consumer on opc.invoice", () => {
    plugin(fakeNitroApp);

    expect(getConsumer("opc.invoice", "order-fulfillment")).toBeTypeOf("function");
  });
});
