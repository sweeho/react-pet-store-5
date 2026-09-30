import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { outboxDeliveries, outboxMessages } from "../../db/schema";
import { dispatchPending } from "../messaging/dispatcher";
import { enqueue, registerConsumer } from "../messaging/outbox";
import { getMailSettings } from "./config";
import { enqueueMail } from "./mailRequest";
import { createMailerHandler } from "./mailer";
import type { MailTransport, OutgoingEmail } from "./transport";

/**
 * UNIT TEST
 *
 * The mailer consumer, driven through the real outbox with a capturing
 * transport (no SMTP server).
 */
const REQUEST = { recipient: "ann@example.com", subject: "S", body: "<b>hello</b>" };
const NOW = new Date("2026-09-26T10:00:00Z");

let sent: OutgoingEmail[];
let logged: Array<[string, unknown]>;

function capturing(): MailTransport {
  return {
    async send(email) {
      sent.push(email);
    },
  };
}

function register(transport: MailTransport, from = getMailSettings({}).from): void {
  registerConsumer(
    "mail.request",
    "mailer",
    createMailerHandler({
      transport,
      from,
      now: () => NOW,
      log: (m, e) => logged.push([m, e]),
    }),
  );
}

function mailDelivery() {
  return db.select().from(outboxDeliveries).where(eq(outboxDeliveries.consumer, "mailer")).get()!;
}

beforeEach(() => {
  sent = [];
  logged = [];
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
});

describe("mailer handler", () => {
  it("[SWHR-C-0421] a request with no subject is never sent and its delivery ends dead", async () => {
    register(capturing());
    db.transaction((tx) =>
      enqueue(tx, "mail.request", JSON.stringify({ recipient: "ann@example.com", body: "b" })),
    );

    await dispatchPending();

    expect(sent).toHaveLength(0);
    expect(mailDelivery().status).toBe("dead");
    expect(mailDelivery().attempts).toBe(1);
  });

  it("[SWHR-C-0422] a well-formed request sends exactly one email with its subject and body", async () => {
    register(capturing());
    db.transaction((tx) => enqueueMail(tx, REQUEST));

    await dispatchPending();
    await dispatchPending();

    expect(sent).toHaveLength(1);
    expect(sent[0]!.subject).toBe("S");
    expect(sent[0]!.html).toBe("<b>hello</b>");
    expect(mailDelivery().status).toBe("delivered");
  });

  it("[SWHR-C-0423] the sent email has To, subject, HTML body and the sent date", async () => {
    register(capturing());
    db.transaction((tx) => enqueueMail(tx, REQUEST));

    await dispatchPending();

    expect(sent[0]).toMatchObject({
      to: "ann@example.com",
      subject: "S",
      html: "<b>hello</b>",
    });
    expect(sent[0]!.date.toISOString()).toBe("2026-09-26T10:00:00.000Z");
  });

  it("[SWHR-C-0424] the default From is customerservice@javapetstoredemo.com", async () => {
    register(capturing());
    db.transaction((tx) => enqueueMail(tx, REQUEST));

    await dispatchPending();

    expect(sent[0]!.from).toBe("customerservice@javapetstoredemo.com");
  });

  it("[SWHR-C-0425] a configured sender is used as From", async () => {
    register(capturing(), getMailSettings({ MAIL_FROM: "orders@shop.example" }).from);
    db.transaction((tx) => enqueueMail(tx, REQUEST));

    await dispatchPending();

    expect(sent[0]!.from).toBe("orders@shop.example");
  });

  it("logs a failed send and consumes the request without retry", async () => {
    let attempts = 0;
    register({
      async send() {
        attempts++;
        throw new Error("smtp down");
      },
    });
    db.transaction((tx) => enqueueMail(tx, REQUEST));

    await dispatchPending();
    await dispatchPending();

    expect(attempts).toBe(1);
    expect(logged).toHaveLength(1);
    expect(logged[0]![1]).toBeInstanceOf(Error);
    expect(mailDelivery().status).toBe("delivered");
  });
});
