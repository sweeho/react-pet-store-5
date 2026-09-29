import { describe, expect, it } from "vitest";

import { getConsumer } from "../lib/messaging/outbox";
import plugin from "./order-intake";

const fakeNitroApp = {} as Parameters<typeof plugin>[0];

describe("order-intake plugin", () => {
  it("registers the order-intake consumer on opc.purchase-order", () => {
    plugin(fakeNitroApp);

    expect(getConsumer("opc.purchase-order", "order-intake")).toBeTypeOf("function");
  });
});
