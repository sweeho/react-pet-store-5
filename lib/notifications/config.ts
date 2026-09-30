/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
export interface NotificationSwitches {
  approval: boolean;
  shipment: boolean;
  completed: boolean;
}

export class NotificationConfigError extends Error {}

export interface MailSettings {
  from: string;
  host: string;
  port: number;
  user?: string;
  password?: string;
}

export function parseNotificationSwitches(_raw: unknown): NotificationSwitches {
  throw new Error("VortexNotImplemented");
}

export function loadNotificationSwitches(_filePath?: string): NotificationSwitches {
  throw new Error("VortexNotImplemented");
}

export function getMailSettings(_env: NodeJS.ProcessEnv = process.env): MailSettings {
  throw new Error("VortexNotImplemented");
}
