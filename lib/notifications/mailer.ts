import type { Handler } from "../messaging/outbox";
import type { MailTransport } from "./transport";

/* eslint-disable @typescript-eslint/no-unused-vars */
export function createMailerHandler(deps: {
  transport: MailTransport;
  from: string;
  now?: () => Date;
  log?: (message: string, error: unknown) => void;
}): Handler {
  throw new Error("VortexNotImplemented");
}
