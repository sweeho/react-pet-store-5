import type { Handler } from "../messaging/outbox";
import { parseMailRequest } from "./mailRequest";
import type { MailTransport } from "./transport";

/**
 * Sends each mail request once. A malformed request throws a
 * `NonRetryableError` (delivery ends `dead`, nothing sent). A failed send
 * is logged and consumed, never retried (D3, SD-2).
 */
export function createMailerHandler(deps: {
  transport: MailTransport;
  from: string;
  now?: () => Date;
  log?: (message: string, error: unknown) => void;
}): Handler {
  const now = deps.now ?? (() => new Date());
  const log = deps.log ?? ((message, error) => console.error(message, error));

  return async (payload) => {
    const request = parseMailRequest(payload);
    try {
      await deps.transport.send({
        from: deps.from,
        to: request.recipient,
        subject: request.subject,
        html: request.body,
        date: now(),
      });
    } catch (error) {
      log(`mail to ${request.recipient} could not be sent`, error);
    }
    return () => {};
  };
}
