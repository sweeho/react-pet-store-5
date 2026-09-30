import nodemailer from "nodemailer";

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

/** The part of a nodemailer transporter this module uses. */
interface Transporter {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
    date: Date;
    encoding?: string;
  }): Promise<unknown>;
}

// Bounds so an unreachable or stalled server ends the attempt instead of hanging the poller.
const TIMEOUT_MS = 10_000;

/** SMTP transport; `transporter` is injectable so tests can read the built message. */
export function createSmtpTransport(
  settings: MailSettings,
  transporter: Transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    ...(settings.user ? { auth: { user: settings.user, pass: settings.password ?? "" } } : {}),
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  }),
): MailTransport {
  return {
    async send(email) {
      await transporter.sendMail({
        from: email.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        date: email.date,
      });
    },
  };
}
