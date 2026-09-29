import type { H3Event } from "nitro/h3";

import type { OrderForm } from "./contact";

export async function placeOrder(
  event: H3Event,
  form: OrderForm,
  opts?: { now?: Date },
): Promise<{ orderId: string; email: string }> {
  void event;
  void form;
  void opts;
  throw new Error("VortexNotImplemented");
}
