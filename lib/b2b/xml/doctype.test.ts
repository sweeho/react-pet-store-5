import { describe, expect, it } from "vitest";

import { checkDocumentType } from "./doctype";
import { DocumentReadError } from "./errors";
import { parseDocument } from "./parse";

const PURCHASE_ORDER_ID =
  "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD PurchaseOrder 1.1//EN";
const SUPPLIER_ORDER_ID =
  "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD SupplierOrder 1.1//EN";

describe("checkDocumentType", () => {
  /**
   * SWHR-R-0045.01 / SWHR-C-0085: a document declaring the SupplierOrder
   * 1.1 type is rejected when read as a purchase order.
   */
  it("[SWHR-C-0085] rejects a document declaring a different document type", () => {
    const xml = `<?xml version="1.0"?>\n<!DOCTYPE SupplierOrder PUBLIC "${SUPPLIER_ORDER_ID}" "http://blueprints.j2ee.sun.com/SupplierOrder.dtd">\n<SupplierOrder/>`;
    const doc = parseDocument(xml);

    expect(() => checkDocumentType(doc, PURCHASE_ORDER_ID)).toThrow(DocumentReadError);
    try {
      checkDocumentType(doc, PURCHASE_ORDER_ID);
      expect.fail("expected checkDocumentType to throw");
    } catch (error) {
      expect((error as Error).message.startsWith("Document not of type")).toBe(true);
    }
  });

  /**
   * SWHR-R-0045.02 / SWHR-C-0086: a purchase order with no DOCTYPE passes
   * the document type check.
   */
  it("[SWHR-C-0086] passes a document with no DOCTYPE declared", () => {
    const doc = parseDocument("<PurchaseOrder><OrderId>1</OrderId></PurchaseOrder>");
    expect(() => checkDocumentType(doc, PURCHASE_ORDER_ID)).not.toThrow();
  });

  it("passes when the declared public identifier matches", () => {
    const xml = `<?xml version="1.0"?>\n<!DOCTYPE PurchaseOrder PUBLIC "${PURCHASE_ORDER_ID}" "http://blueprints.j2ee.sun.com/PurchaseOrder.dtd">\n<PurchaseOrder/>`;
    const doc = parseDocument(xml);
    expect(() => checkDocumentType(doc, PURCHASE_ORDER_ID)).not.toThrow();
  });
});
