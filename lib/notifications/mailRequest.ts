import { NonRetryableError } from "../messaging/errors";
import type { Tx } from "../messaging/outbox";

export interface MailRequest {
  recipient: string;
  subject: string;
  body: string;
}

export class MailRequestValidationError extends NonRetryableError {
  constructor(message: string) {
    super(message);
    this.name = "MailRequestValidationError";
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export function parseMailRequest(payload: string): MailRequest {
  throw new Error("VortexNotImplemented");
}

export function enqueueMail(tx: Tx, request: MailRequest): string {
  throw new Error("VortexNotImplemented");
}
