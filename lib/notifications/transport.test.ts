import nodemailer from "nodemailer";
import { describe, expect, it } from "vitest";

import { createSmtpTransport } from "./transport";

/** UNIT TEST — the SMTP transport, through nodemailer's stream transport. */
describe("createSmtpTransport", () => {
  it("sends UTF-8 HTML with the given From, To, subject and Date header", async () => {
    let raw = "";
    const capture = nodemailer.createTransport({ streamTransport: true, buffer: true });
    const transporter = {
      async sendMail(options: Parameters<typeof capture.sendMail>[0]) {
        const info = await capture.sendMail(options);
        raw = info.message.toString();
        return info;
      },
    };
    const transport = createSmtpTransport({ from: "x", host: "localhost", port: 25 }, transporter);

    await transport.send({
      from: "orders@shop.example",
      to: "ann@example.com",
      subject: "S",
      html: "<b>こんにちは</b>",
      date: new Date("2026-09-26T10:00:00Z"),
    });

    expect(raw).toMatch(/^From: orders@shop\.example$/m);
    expect(raw).toMatch(/^To: ann@example\.com$/m);
    expect(raw).toMatch(/^Subject: S$/m);
    expect(raw).toMatch(/^Date: Sat, 26 Sep 2026 10:00:00 \+0000$/m);
    expect(raw).toMatch(/Content-Type: text\/html; charset=utf-8/i);
  });

  it("builds an SMTP transporter without contacting the server", () => {
    expect(() =>
      createSmtpTransport({ from: "x", host: "localhost", port: 2525, user: "u", password: "p" }),
    ).not.toThrow();
  });
});
