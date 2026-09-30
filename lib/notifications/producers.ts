import type { Handler } from "../messaging/outbox";
import type { NotificationSwitches } from "./config";

/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
export function createApprovalNoticeHandler(_switches: NotificationSwitches): Handler {
  throw new Error("VortexNotImplemented");
}

export function createShipmentNoticeHandler(_switches: NotificationSwitches): Handler {
  throw new Error("VortexNotImplemented");
}

export function createCompletedNoticeHandler(_switches: NotificationSwitches): Handler {
  throw new Error("VortexNotImplemented");
}
