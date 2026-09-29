import type { Executor } from "../account/types";

export function withReadTransaction<T>(fn: (tx: Executor) => T): T {
  void fn;
  throw new Error("VortexNotImplemented");
}
