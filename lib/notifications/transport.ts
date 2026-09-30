import type { MailSettings } from "./config";

export interface OutgoingEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
  date: Date;
}

export interface MailTransport {
  send(email: OutgoingEmail): Promise<void>;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export function createSmtpTransport(settings: MailSettings): MailTransport {
  throw new Error("VortexNotImplemented");
}
