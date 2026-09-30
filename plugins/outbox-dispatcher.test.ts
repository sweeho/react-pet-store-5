import { afterEach, describe, expect, it, vi } from "vitest";

const dispatchPending = vi.hoisted(() => vi.fn());
vi.mock("../lib/messaging/dispatcher", () => ({ dispatchPending }));

import plugin from "./outbox-dispatcher";

const fakeNitroApp = {} as Parameters<typeof plugin>[0];

describe("outbox-dispatcher plugin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    dispatchPending.mockReset();
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

  function tickOnce(): () => void {
    const original = process.env.VITEST;
    delete process.env.VITEST;
    const spy = vi.spyOn(global, "setInterval").mockReturnValue(0 as unknown as NodeJS.Timeout);
    try {
      plugin(fakeNitroApp);
    } finally {
      process.env.VITEST = original;
    }
    return spy.mock.calls[0]![0] as () => void;
  }

  it("never runs mail.request deliveries", () => {
    dispatchPending.mockResolvedValue({ delivered: 0, failed: 0 });
    tickOnce()();
    expect(dispatchPending).toHaveBeenCalledWith({ except: ["mail.request"] });
  });

  it("skips a tick while the previous pass is still running", async () => {
    let finish: () => void = () => {};
    dispatchPending.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const tick = tickOnce();

    tick();
    tick();
    expect(dispatchPending).toHaveBeenCalledTimes(1);

    finish();
    await Promise.resolve();
    await Promise.resolve();
    tick();
    expect(dispatchPending).toHaveBeenCalledTimes(2);
  });
});
