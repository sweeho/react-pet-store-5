import { afterEach, describe, expect, it, vi } from "vitest";

const dispatchPending = vi.hoisted(() => vi.fn());
vi.mock("../lib/messaging/dispatcher", () => ({ dispatchPending }));

import { getConsumer } from "../lib/messaging/outbox";
import plugin from "./mail-sender";

const fakeNitroApp = {} as Parameters<typeof plugin>[0];

function activate(): { spy: ReturnType<typeof vi.spyOn>; tick: () => void } {
  const original = process.env.VITEST;
  delete process.env.VITEST;
  const spy = vi.spyOn(global, "setInterval").mockReturnValue(0 as unknown as NodeJS.Timeout);
  try {
    plugin(fakeNitroApp);
  } finally {
    process.env.VITEST = original;
  }
  return { spy, tick: () => (spy.mock.calls[0]![0] as () => void)() };
}

describe("mail-sender plugin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    dispatchPending.mockReset();
    delete process.env.OUTBOX_POLL_MS;
  });

  it("registers the mailer consumer on mail.request", () => {
    plugin(fakeNitroApp);
    expect(getConsumer("mail.request", "mailer")).toBeTypeOf("function");
  });

  it("does not poll under Vitest", () => {
    const spy = vi.spyOn(global, "setInterval");
    plugin(fakeNitroApp);
    expect(spy).not.toHaveBeenCalled();
  });

  it("polls only mail.request every OUTBOX_POLL_MS", () => {
    process.env.OUTBOX_POLL_MS = "5000";
    dispatchPending.mockResolvedValue({ delivered: 0, failed: 0 });
    const { spy, tick } = activate();

    expect(spy.mock.calls[0]![1]).toBe(5000);
    tick();
    expect(dispatchPending).toHaveBeenCalledWith({ only: ["mail.request"] });
  });

  it("skips a tick while the previous pass is still running", async () => {
    let finish: () => void = () => {};
    dispatchPending.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const { tick } = activate();

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
