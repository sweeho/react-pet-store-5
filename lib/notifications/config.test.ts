import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getMailSettings,
  loadNotificationSwitches,
  NotificationConfigError,
  parseNotificationSwitches,
} from "./config";

const ALL = { sendApprovalMail: true, sendShipmentMail: true, sendCompletedOrderMail: true };

function tmpFile(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "notif-"));
  const file = path.join(dir, "notification-config.json");
  fs.writeFileSync(file, content);
  return file;
}

function errorOf(fn: () => unknown): unknown {
  try {
    fn();
  } catch (e) {
    return e;
  }
  return undefined;
}

describe("parseNotificationSwitches", () => {
  it("[SWHR-C-0419] refuses a missing completed-order switch, naming it", () => {
    const e = errorOf(() =>
      parseNotificationSwitches({ sendApprovalMail: true, sendShipmentMail: true }),
    );
    expect(e).toBeInstanceOf(NotificationConfigError);
    expect((e as Error).message).toContain("sendCompletedOrderMail");
  });

  it("[SWHR-C-0419] loading a file without the completed-order switch fails naming it", () => {
    const file = tmpFile(JSON.stringify({ sendApprovalMail: true, sendShipmentMail: true }));
    const e = errorOf(() => loadNotificationSwitches(file));
    expect(e).toBeInstanceOf(NotificationConfigError);
    expect((e as Error).message).toContain("sendCompletedOrderMail");
  });

  it("maps the three keys", () => {
    expect(
      parseNotificationSwitches({
        sendApprovalMail: true,
        sendShipmentMail: false,
        sendCompletedOrderMail: true,
      }),
    ).toEqual({ approval: true, shipment: false, completed: true });
  });

  it.each([
    ["a string", "true"],
    ["a number", 1],
    ["null", null],
  ])("refuses %s as a switch value, naming the key", (_label, value) => {
    const e = errorOf(() => parseNotificationSwitches({ ...ALL, sendShipmentMail: value }));
    expect(e).toBeInstanceOf(NotificationConfigError);
    expect((e as Error).message).toContain("sendShipmentMail");
  });

  it("refuses a non-object", () => {
    expect(() => parseNotificationSwitches(null)).toThrow(NotificationConfigError);
  });
});

describe("loadNotificationSwitches", () => {
  it("refuses a missing file", () => {
    expect(() => loadNotificationSwitches("/nonexistent/nope.json")).toThrow(
      NotificationConfigError,
    );
  });

  it("refuses invalid JSON", () => {
    expect(() => loadNotificationSwitches(tmpFile("{nope"))).toThrow(NotificationConfigError);
  });

  it("loads the committed file as all true", () => {
    const saved = process.env.NOTIFICATION_CONFIG_PATH;
    delete process.env.NOTIFICATION_CONFIG_PATH;
    try {
      expect(loadNotificationSwitches()).toEqual({
        approval: true,
        shipment: true,
        completed: true,
      });
    } finally {
      if (saved !== undefined) process.env.NOTIFICATION_CONFIG_PATH = saved;
    }
  });

  it("honours NOTIFICATION_CONFIG_PATH", () => {
    const file = tmpFile(JSON.stringify({ ...ALL, sendApprovalMail: false }));
    const saved = process.env.NOTIFICATION_CONFIG_PATH;
    process.env.NOTIFICATION_CONFIG_PATH = file;
    try {
      expect(loadNotificationSwitches().approval).toBe(false);
    } finally {
      if (saved === undefined) delete process.env.NOTIFICATION_CONFIG_PATH;
      else process.env.NOTIFICATION_CONFIG_PATH = saved;
    }
  });
});

describe("getMailSettings", () => {
  it("defaults", () => {
    expect(getMailSettings({})).toEqual({
      from: "customerservice@javapetstoredemo.com",
      host: "localhost",
      port: 25,
      user: undefined,
      password: undefined,
    });
  });

  it("takes overrides from the environment", () => {
    expect(
      getMailSettings({
        MAIL_FROM: "a@b.c",
        SMTP_HOST: "mail.example",
        SMTP_PORT: "587",
        SMTP_USER: "u",
        SMTP_PASSWORD: "p",
      }),
    ).toEqual({ from: "a@b.c", host: "mail.example", port: 587, user: "u", password: "p" });
  });

  it.each(["abc", "25.5", "1e3"])("refuses SMTP_PORT=%s", (port) => {
    const e = errorOf(() => getMailSettings({ SMTP_PORT: port }));
    expect(e).toBeInstanceOf(NotificationConfigError);
    expect((e as Error).message).toContain("SMTP_PORT");
  });
});
