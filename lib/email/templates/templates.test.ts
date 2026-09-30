// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { renderCustomerEmail } from "../render";
import type { EmailOrder } from "../types";

/**
 * UNIT TEST
 *
 * Customer e-mail content (P4): HTML bodies, spec subjects, escaping and the
 * ja_JP / zh_CN wording. Bodies are parsed with the DOM rather than matched
 * as strings.
 */
const LINES = [
  { categoryId: "FISH", productId: "FI-SW-01", itemId: "EST-1", quantity: 2, unitPrice: 16.5 },
  { categoryId: "DOGS", productId: "K9-BD-01", itemId: "EST-6", quantity: 1, unitPrice: 18.5 },
];

function order(overrides: Partial<EmailOrder> = {}): EmailOrder {
  return { orderId: "1001", locale: "en_US", lines: LINES, ...overrides };
}

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function rows(doc: Document): string[][] {
  return Array.from(doc.querySelectorAll("tbody tr")).map((tr) =>
    Array.from(tr.querySelectorAll("td")).map((td) => td.textContent ?? ""),
  );
}

function text(html: string): string {
  return parse(html).body.textContent ?? "";
}

describe("customer e-mail templates", () => {
  it("[SWHR-C-0428] approved e-mail for 1001 thanks the customer and states approval", () => {
    const email = renderCustomerEmail("approval", order({ decision: "APPROVED" }));
    const t = text(email.body);
    expect(t).toContain("Thank you for placing an order with us.");
    expect(t).toContain("1001");
    expect(t).toContain("approved!");
    expect(t).toContain("We will now fulfill your order.");
    expect(t).not.toContain("denied");
  });

  it("[SWHR-C-0429] denied e-mail for 1002 states denial", () => {
    const email = renderCustomerEmail("approval", order({ orderId: "1002", decision: "DENIED" }));
    const t = text(email.body);
    expect(t).toContain("1002");
    expect(t).toContain("denied unfortunately.");
    expect(t).toContain("Sorry we could not place your order.");
    expect(t).not.toContain("approved!");
  });

  it("[SWHR-C-0430] shipment e-mail shows headers and two formatted rows", () => {
    const email = renderCustomerEmail("shipment", order());
    const doc = parse(email.body);
    expect(Array.from(doc.querySelectorAll("th")).map((th) => th.textContent)).toEqual([
      "Category",
      "Product #",
      "Quantity",
      "Unit Price",
    ]);
    expect(rows(doc)).toEqual([
      ["FISH", "FI-SW-01", "2", "$16.50"],
      ["DOGS", "K9-BD-01", "1", "$18.50"],
    ]);
    expect(text(email.body)).toContain("1001");
    expect(text(email.body)).toContain("has shipped");
  });

  it("completed e-mail says the entire order shipped and lists every line", () => {
    const three = [
      ...LINES,
      {
        categoryId: "CATS",
        productId: "FL-DSH-01",
        itemId: "EST-16",
        quantity: 1,
        unitPrice: 58.5,
      },
    ];
    const email = renderCustomerEmail("completed", order({ lines: three }));
    expect(text(email.body)).toContain("entire order");
    expect(rows(parse(email.body))).toHaveLength(3);
    expect(rows(parse(email.body))[2]).toEqual(["CATS", "FL-DSH-01", "1", "$58.50"]);
  });

  it("subjects are English in every locale", () => {
    for (const locale of ["en_US", "ja_JP", "zh_CN"]) {
      const o = order({ locale });
      expect(renderCustomerEmail("approval", o).subject).toBe("Java Pet Store Order Status: 1001");
      expect(renderCustomerEmail("shipment", o).subject).toBe("Java Pet Store Order Shipped: 1001");
      expect(renderCustomerEmail("completed", o).subject).toBe(
        "Java Pet Store Order COMPLETED: 1001",
      );
    }
  });

  it("bodies are self-contained HTML documents with inline styles only", () => {
    const email = renderCustomerEmail("shipment", order());
    expect(email.body).toMatch(/^<!doctype html>/i);
    expect(email.body).not.toContain("<style");
    expect(email.body).not.toContain("class=");
  });

  it("ja_JP and zh_CN bodies carry their own wording for all three kinds", () => {
    const kana = /[぀-ヿ]/;
    const han = /[一-鿿]/;
    for (const kind of ["approval", "shipment", "completed"] as const) {
      const ja = text(
        renderCustomerEmail(kind, order({ locale: "ja_JP", decision: "APPROVED" })).body,
      );
      const zh = text(
        renderCustomerEmail(kind, order({ locale: "zh_CN", decision: "APPROVED" })).body,
      );
      expect(ja).toMatch(kana);
      expect(zh).toMatch(han);
      expect(zh).not.toMatch(kana);
      expect(ja).not.toContain("Thank you for placing");
      expect(zh).not.toContain("Thank you for placing");
    }
  });

  it("escapes every interpolated value", () => {
    const email = renderCustomerEmail(
      "shipment",
      order({
        orderId: "<i>1</i>",
        lines: [{ categoryId: "<b>", productId: "a&b", itemId: "x", quantity: 1, unitPrice: 1 }],
      }),
    );
    expect(email.body).toContain("&lt;b&gt;");
    expect(email.body).toContain("a&amp;b");
    expect(email.body).not.toContain("<b>");
    expect(email.body).not.toContain("<i>");
    expect(rows(parse(email.body))[0][0]).toBe("<b>");
  });
});
