import { describe, expect, it } from "vitest";

import { validateDocument } from "../xml/validate";
import {
  type ApprovalEntry,
  ORDER_APPROVAL_PUBLIC_ID,
  readOrderApproval,
  writeOrderApproval,
} from "./orderApproval";

const ENTRIES: ApprovalEntry[] = [
  { orderId: "1001", status: "APPROVED" },
  { orderId: "1002", status: "DENIED" },
];

const quiet = { log: () => {} };

function withOrder(inner: string): string {
  return `<?xml version="1.0"?><OrderApproval><Order>${inner}</Order></OrderApproval>`;
}

describe("OrderApproval document", () => {
  it("round-trips entries and validates against the bundled XSD", async () => {
    const xml = writeOrderApproval(ENTRIES);
    expect(xml).toContain("<!DOCTYPE OrderApproval");
    expect(await validateDocument(xml, ORDER_APPROVAL_PUBLIC_ID)).toEqual({
      valid: true,
      errors: [],
    });
    expect(await readOrderApproval(xml, quiet)).toEqual(ENTRIES);
  });

  it("refuses to write an empty batch", () => {
    expect(() => writeOrderApproval([])).toThrow();
  });

  for (const validate of [true, false]) {
    describe(`with validation ${validate ? "on" : "off"}`, () => {
      const opts = { ...quiet, validate };

      it("[SWHR-C-0303] rejects a document with a non-approval root", async () => {
        const xml = '<?xml version="1.0"?><PurchaseOrder><OrderId>1</OrderId></PurchaseOrder>';
        await expect(readOrderApproval(xml, opts)).rejects.toThrow(
          "OrderApproval element expected",
        );
      });

      it("[SWHR-C-0304] rejects a batch with no orders", async () => {
        await expect(readOrderApproval("<OrderApproval/>", opts)).rejects.toThrow(
          "Order element expected",
        );
      });

      it("[SWHR-C-0305] rejects an order with an empty status, naming OrderStatus", async () => {
        const xml = withOrder("<OrderId>1</OrderId><OrderStatus></OrderStatus>");
        await expect(readOrderApproval(xml, opts)).rejects.toThrow("OrderStatus");
      });

      it("[SWHR-C-0305] rejects an order with a missing status, naming OrderStatus", async () => {
        const xml = withOrder("<OrderId>1</OrderId>");
        await expect(readOrderApproval(xml, opts)).rejects.toThrow("OrderStatus");
      });
    });
  }
});
