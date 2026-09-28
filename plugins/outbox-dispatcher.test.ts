import { afterEach, describe, expect, it, vi } from "vitest";

import plugin from "./outbox-dispatcher";

const fakeNitroApp = {} as Parameters<typeof plugin>[0];

describe("outbox-dispatcher plugin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing under Vitest (VITEST is set for every test run)", () => {
    const spy = vi.spyOn(global, "setInterval");

    plugin(fakeNitroApp);

    expect(spy).not.toHaveBeenCalled();
  });

  it("polls on an interval when active, defaulting to 1000ms", () => {
    const original = process.env.VITEST;
    delete process.env.VITEST;
    const spy = vi.spyOn(global, "setInterval").mockReturnValue(0 as unknown as NodeJS.Timeout);

    try {
      plugin(fakeNitroApp);
    } finally {
      process.env.VITEST = original;
    }

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![1]).toBe(1000);
  });

  it("reads the poll interval from OUTBOX_POLL_MS when active", () => {
    const original = process.env.VITEST;
    delete process.env.VITEST;
    process.env.OUTBOX_POLL_MS = "5000";
    const spy = vi.spyOn(global, "setInterval").mockReturnValue(0 as unknown as NodeJS.Timeout);

    try {
      plugin(fakeNitroApp);
    } finally {
      process.env.VITEST = original;
      delete process.env.OUTBOX_POLL_MS;
    }

    expect(spy.mock.calls[0]![1]).toBe(5000);
  });
});
