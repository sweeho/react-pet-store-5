import { describe, expect, it } from "vitest";

import { EmailTemplateNotFoundError, renderCustomerEmail } from "./render";
import type { EmailOrder } from "./types";

/**
 * UNIT TEST
 *
 * Customer e-mail template selection by order locale (D5, Q3): a parsed
 * locale picks its own template, an unparseable locale falls back to the
 * base template, and a parsed locale with no template fails outright.
 */
function order(overrides: Partial<EmailOrder> = {}): EmailOrder {
  return {
    orderId: "ORDER-1",
    locale: "en_US",
    lines: [{ itemId: "ITEM-1", name: "Widget", quantity: 1, unitPrice: 1234.5 }],
    ...overrides,
  };
}

describe("renderCustomerEmail", () => {
  it("[AC-2] renders a Japanese order's shipment email from the Japanese shipment template", () => {
    const email = renderCustomerEmail("shipment", order({ locale: "ja_JP" }));
    expect(email.templateId).toBe("shipment_ja_JP");
  });

  it("[AC-3] renders from the default template when the order locale cannot be resolved", () => {
    const email = renderCustomerEmail("approval", order({ locale: "en" }));
    expect(email.templateId).toBe("approval_default");
  });

  it("[AC-4] fails when the order locale resolves but has no template", () => {
    expect(() => renderCustomerEmail("completed", order({ locale: "de_DE" }))).toThrow(
      EmailTemplateNotFoundError,
    );
    expect(() => renderCustomerEmail("completed", order({ locale: "de_DE" }))).toThrow(
      "No template found for locale de_DE",
    );
  });

  it("[AC-5] renders an en_US completed-order email with the unit price as $1,234.50", () => {
    const email = renderCustomerEmail("completed", order({ locale: "en_US" }));
    expect(email.body).toContain("$1,234.50");
  });

  it("[AC-6] renders a ja_JP completed-order email with the unit price as ￥2,000", () => {
    const email = renderCustomerEmail(
      "completed",
      order({
        locale: "ja_JP",
        lines: [{ itemId: "ITEM-1", name: "Widget", quantity: 1, unitPrice: 2000 }],
      }),
    );
    expect(email.body).toContain("￥2,000");
  });

  it("renders every kind for every supported template locale with a matching templateId", () => {
    for (const kind of ["approval", "shipment", "completed"] as const) {
      for (const locale of ["en_US", "ja_JP", "zh_CN"] as const) {
        const email = renderCustomerEmail(kind, order({ locale }));
        expect(email.templateId).toBe(`${kind}_${locale}`);
      }
    }
  });
});
