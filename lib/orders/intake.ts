import type { Handler } from "../messaging/outbox";

export function createOrderIntakeHandler(): Handler {
  return async () => {
    throw new Error("VortexNotImplemented");
  };
}
