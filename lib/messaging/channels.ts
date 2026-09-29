import type { Channel } from "./outbox";

export function resolveChannel(name: string, registry?: readonly string[]): Channel {
  void [name, registry];
  throw new Error("VortexNotImplemented");
}
