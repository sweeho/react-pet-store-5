import { NonRetryableError } from "../messaging/errors";
import { enqueue, type Tx } from "../messaging/outbox";

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

const KEYS = ["recipient", "subject", "body"] as const;

/** Accepts only a JSON object whose keys are exactly recipient, subject, body, in that order, each a non-empty string. */
export function parseMailRequest(payload: string): MailRequest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new MailRequestValidationError("mail request: payload is not valid JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new MailRequestValidationError("mail request: payload is not a JSON object");
  }
  const record = parsed as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== KEYS.length || keys.some((k, i) => k !== KEYS[i])) {
    throw new MailRequestValidationError(
      `mail request: keys must be exactly ${KEYS.join(", ")} (got ${keys.join(", ") || "none"})`,
    );
  }
  for (const key of KEYS) {
    const value = record[key];
    if (typeof value !== "string" || value === "") {
      throw new MailRequestValidationError(`mail request: "${key}" must be a non-empty string`);
    }
  }
  return {
    recipient: record.recipient as string,
    subject: record.subject as string,
    body: record.body as string,
  };
}

/** Validates, then enqueues on `mail.request` inside the caller's transaction. */
export function enqueueMail(tx: Tx, request: MailRequest): string {
  const payload = JSON.stringify({
    recipient: request.recipient,
    subject: request.subject,
    body: request.body,
  });
  parseMailRequest(payload);
  return enqueue(tx, "mail.request", payload);
}
