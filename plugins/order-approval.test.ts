import { describe, expect, it } from "vitest";

import { getConsumer } from "../lib/messaging/outbox";
import plugin from "./order-approval";

const fakeNitroApp = {} as Parameters<typeof plugin>[0];

describe("order-approval plugin", () => {
  it("registers the order-approval consumer on opc.order-approval", () => {
    plugin(fakeNitroApp);

    expect(getConsumer("opc.order-approval", "order-approval")).toBeTypeOf("function");
  });
});
