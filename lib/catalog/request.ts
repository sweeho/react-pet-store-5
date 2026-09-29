import type { H3Event } from "nitro/h3";

export interface RequestPaging {
  start: number;
  count: number;
}

export function resolveLocale(event: H3Event): string {
  void event;
  throw new Error("VortexNotImplemented");
}

export function resolvePaging(event: H3Event): RequestPaging {
  void event;
  throw new Error("VortexNotImplemented");
}

export function withCatalogErrorHandling<T>(fn: () => T): T {
  void fn;
  throw new Error("VortexNotImplemented");
}
