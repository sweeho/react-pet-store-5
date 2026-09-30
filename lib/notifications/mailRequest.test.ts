import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../db/client";
import { outboxDeliveries, outboxMessages } from "../../db/schema";
import { NonRetryableError } from "../messaging/errors";
import { enqueueMail, MailRequestValidationError, parseMailRequest } from "./mailRequest";

/** UNIT TEST — mail request structure and validation. */
const valid = { recipient: "ann@example.com", subject: "S", body: "<b>hello</b>" };

beforeEach(() => {
  db.delete(outboxDeliveries).run();
  db.delete(outboxMessages).run();
});

describe("parseMailRequest", () => {
  it("[SWHR-C-0421] rejects a request with no subject with a validation error", () => {
    const payload = JSON.stringify({ recipient: "ann@example.com", body: "b" });
    expect(() => parseMailRequest(payload)).toThrow(MailRequestValidationError);
  });

  it("returns a well-formed request", () => {
    expect(parseMailRequest(JSON.stringify(valid))).toEqual(valid);
  });

  it("a validation error is non-retryable", () => {
    expect(() => parseMailRequest("{")).toThrow(NonRetryableError);
  });

  it("rejects a non-JSON payload and non-object JSON", () => {
    expect(() => parseMailRequest("not json")).toThrow(MailRequestValidationError);
    expect(() => parseMailRequest("[]")).toThrow(MailRequestValidationError);
    expect(() => parseMailRequest("null")).toThrow(MailRequestValidationError);
  });

  it("rejects an empty or non-string field", () => {
    expect(() => parseMailRequest(JSON.stringify({ ...valid, body: "" }))).toThrow(
      MailRequestValidationError,
    );
    expect(() => parseMailRequest(JSON.stringify({ ...valid, subject: 5 }))).toThrow(
      MailRequestValidationError,
    );
  });

  it("rejects extra keys and keys out of order", () => {
    expect(() => parseMailRequest(JSON.stringify({ ...valid, extra: "x" }))).toThrow(
      MailRequestValidationError,
    );
    const reordered = { subject: "S", recipient: "ann@example.com", body: "b" };
    expect(() => parseMailRequest(JSON.stringify(reordered))).toThrow(MailRequestValidationError);
  });
});

describe("enqueueMail", () => {
  it("refuses an invalid request and enqueues nothing", () => {
    expect(() => db.transaction((tx) => enqueueMail(tx, { ...valid, subject: "" }))).toThrow(
      MailRequestValidationError,
    );
    expect(db.select().from(outboxMessages).all()).toHaveLength(0);
  });

  it("enqueues a valid request on mail.request for the mailer, keys in order", () => {
    const id = db.transaction((tx) => enqueueMail(tx, valid));
    const msg = db.select().from(outboxMessages).where(eq(outboxMessages.id, id)).get()!;
    expect(msg.channel).toBe("mail.request");
    expect(msg.payload).toBe(JSON.stringify(valid));
    const deliveries = db.select().from(outboxDeliveries).all();
    expect(deliveries.map((d) => d.consumer)).toEqual(["mailer"]);
  });
});
