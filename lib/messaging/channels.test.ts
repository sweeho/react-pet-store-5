import { describe, expect, it, vi } from "vitest";

import { resolveChannel } from "./channels";
import { DependencyResolutionError } from "./errors";

describe("resolveChannel", () => {
  it("[SWHR-C-0389] raises a dependency-resolution error with its cause and uses no fallback when the invoice channel is missing", () => {
    const fallback = vi.fn();
    const registry = ["opc.purchase-order", "opc.order-approval"];

    let thrown: unknown;
    try {
      resolveChannel("opc.invoice", registry);
      fallback();
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(DependencyResolutionError);
    expect((thrown as DependencyResolutionError).cause).toBeInstanceOf(Error);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("returns a configured channel", () => {
    expect(resolveChannel("opc.invoice", ["opc.invoice"])).toBe("opc.invoice");
  });

  it("defaults to the outbox's channels, including opc.completed-order", () => {
    expect(resolveChannel("opc.completed-order")).toBe("opc.completed-order");
    expect(resolveChannel("mail.request")).toBe("mail.request");
    expect(() => resolveChannel("opc.nope")).toThrow(DependencyResolutionError);
  });
});
