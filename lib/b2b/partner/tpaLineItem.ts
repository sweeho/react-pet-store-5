import type { Element } from "@xmldom/xmldom";

import type { LineItem } from "../elements/lineItem";
import { DocumentReadError } from "../xml/errors";

export const TPA_LINE_ITEM_NAMESPACE = "http://blueprints.j2ee.sun.com/TPALineItem";

const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * SWHR-R-0039: `categoryId`, `productId`, `itemId`, `lineNo`, `quantity`
 * and `unitPrice` as attributes of a `LineItem` element in the TPALineItem
 * namespace — unlike the internal `LineItem`, which carries the same six
 * values as child elements. `quantity` is written as a whole number;
 * `unitPrice` is written exactly as given (design.md P2 — no float round
 * trip, R8).
 */
export function writeTPALineItem(parent: Element, item: LineItem): Element {
  const doc = parent.ownerDocument;
  if (!doc) {
    throw new Error("LineItem: parent element has no owner document.");
  }
  const el = doc.createElementNS(TPA_LINE_ITEM_NAMESPACE, "LineItem");
  el.setAttribute("categoryId", item.categoryId);
  el.setAttribute("productId", item.productId);
  el.setAttribute("itemId", item.itemId);
  el.setAttribute("lineNo", String(item.lineNum));
  el.setAttribute("quantity", String(item.quantity));
  el.setAttribute("unitPrice", item.unitPrice);
  parent.appendChild(el);

  return el;
}

/**
 * SWHR-R-0039: rejects a node that is not a `LineItem` in the TPALineItem
 * namespace, or an attribute that is not an integer/decimal where the
 * value ranges require one.
 */
export function readTPALineItem(el: Element): LineItem {
  if (el.localName !== "LineItem" || el.namespaceURI !== TPA_LINE_ITEM_NAMESPACE) {
    throw new DocumentReadError("LineItem element expected.");
  }

  const categoryId = requireAttribute(el, "categoryId");
  const productId = requireAttribute(el, "productId");
  const itemId = requireAttribute(el, "itemId");
  const lineNoText = requireAttribute(el, "lineNo");
  const quantityText = requireAttribute(el, "quantity");
  const unitPrice = requireAttribute(el, "unitPrice");

  if (!INTEGER_PATTERN.test(lineNoText)) {
    throw new DocumentReadError("lineNo attribute: integer expected.");
  }
  if (!INTEGER_PATTERN.test(quantityText)) {
    throw new DocumentReadError("quantity attribute: integer expected.");
  }
  if (!DECIMAL_PATTERN.test(unitPrice)) {
    throw new DocumentReadError("unitPrice attribute: decimal number expected.");
  }

  return {
    categoryId,
    productId,
    itemId,
    lineNum: Number(lineNoText),
    quantity: Number(quantityText),
    unitPrice,
  };
}

function requireAttribute(el: Element, name: string): string {
  if (!el.hasAttribute(name)) {
    throw new DocumentReadError(`${name} attribute expected.`);
  }
  return el.getAttribute(name) ?? "";
}
