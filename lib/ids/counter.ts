import type { Executor } from "../account/types";

export const ORDER_ID_PREFIX = "1001";

export class CounterCreationError extends Error {}

export function nextId(prefix: string, tx?: Executor): string {
  void prefix;
  void tx;
  throw new Error("VortexNotImplemented");
}
