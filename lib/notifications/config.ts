import fs from "node:fs";
import path from "node:path";

export interface NotificationSwitches {
  approval: boolean;
  shipment: boolean;
  completed: boolean;
}

export class NotificationConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationConfigError";
  }
}

export interface MailSettings {
  from: string;
  host: string;
  port: number;
  user?: string;
  password?: string;
}

const SWITCH_KEYS = {
  approval: "sendApprovalMail",
  shipment: "sendShipmentMail",
  completed: "sendCompletedOrderMail",
} as const;

/** Accepts only JSON booleans; a missing or non-boolean key names itself in the error. */
export function parseNotificationSwitches(raw: unknown): NotificationSwitches {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new NotificationConfigError("notification-config: expected a JSON object of switches");
  }
  const record = raw as Record<string, unknown>;
  const read = (key: string): boolean => {
    const value = record[key];
    if (typeof value !== "boolean") {
      throw new NotificationConfigError(
        `notification-config: switch "${key}" is ${
          value === undefined ? "missing" : "not a boolean"
        }`,
      );
    }
    return value;
  };
  return {
    approval: read(SWITCH_KEYS.approval),
    shipment: read(SWITCH_KEYS.shipment),
    completed: read(SWITCH_KEYS.completed),
  };
}

/** Reads `NOTIFICATION_CONFIG_PATH`, else `configs/notification-config.json` from the cwd. */
export function loadNotificationSwitches(filePath?: string): NotificationSwitches {
  const file =
    filePath ??
    process.env.NOTIFICATION_CONFIG_PATH ??
    path.join(process.cwd(), "configs", "notification-config.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    throw new NotificationConfigError(
      `notification-config: cannot read ${file}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  return parseNotificationSwitches(parsed);
}

export function getMailSettings(env: NodeJS.ProcessEnv = process.env): MailSettings {
  const rawPort = env.SMTP_PORT;
  if (rawPort !== undefined && !/^\d+$/.test(rawPort)) {
    throw new NotificationConfigError(`mail settings: SMTP_PORT "${rawPort}" is not an integer`);
  }
  return {
    from: env.MAIL_FROM || "customerservice@javapetstoredemo.com",
    host: env.SMTP_HOST || "localhost",
    port: rawPort === undefined ? 25 : Number(rawPort),
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
  };
}
