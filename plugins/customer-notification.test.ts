import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import plugin from "./customer-notification";

const fakeNitroApp = {} as Parameters<typeof plugin>[0];
const saved = process.env.NOTIFICATION_CONFIG_PATH;

afterEach(() => {
  if (saved === undefined) delete process.env.NOTIFICATION_CONFIG_PATH;
  else process.env.NOTIFICATION_CONFIG_PATH = saved;
});

describe("customer-notification plugin", () => {
  it("[SWHR-C-0419] throws at start naming a missing switch", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "notif-"));
    const file = path.join(dir, "c.json");
    fs.writeFileSync(file, JSON.stringify({ sendApprovalMail: true, sendShipmentMail: true }));
    process.env.NOTIFICATION_CONFIG_PATH = file;

    expect(() => plugin(fakeNitroApp)).toThrow(/sendCompletedOrderMail/);
  });

  it("starts with the committed config file", () => {
    delete process.env.NOTIFICATION_CONFIG_PATH;
    expect(() => plugin(fakeNitroApp)).not.toThrow();
  });
});
