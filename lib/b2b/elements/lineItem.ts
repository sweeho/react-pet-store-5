import type { Element } from "@xmldom/xmldom";

import { appendTextElement } from "../xml/build";
import { DocumentReadError } from "../xml/errors";
import { ChildReader, expectRoot } from "../xml/read";

export interface LineItem {
  categoryId: string;
  productId: string;
  itemId: string;
  lineNum: number;
  quantity: number;
  unitPrice: string;
}

/** A persisted line item, carrying quantity already shipped (design.md P5). */
export interface StoredLineItem extends LineItem {
  quantityShipped: number;
}

const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * SWHR-R-0031: `CategoryId`, `ProductId`, `ItemId`, `LineNum`, `Quantity`,
 * `UnitPrice`, in that order. `unitPrice` is written exactly as given
 * (design.md P2 — no float round trip).
 */
export function writeLineItem(parent: Element, item: LineItem): Element {
  const doc = parent.ownerDocument;
  if (!doc) {
    throw new Error("LineItem: parent element has no owner document.");
  }
  const el = doc.createElement("LineItem");
  parent.appendChild(el);

  appendTextElement(el, "CategoryId", item.categoryId);
  appendTextElement(el, "ProductId", item.productId);
  appendTextElement(el, "ItemId", item.itemId);
  appendTextElement(el, "LineNum", String(item.lineNum));
  appendTextElement(el, "Quantity", String(item.quantity));
  appendTextElement(el, "UnitPrice", item.unitPrice);

  return el;
}

/**
 * SWHR-R-0031: rejects a node that is not `LineItem`, a missing or
 * out-of-order child, a `Quantity` that is not an integer, or a
 * `UnitPrice` that is not a decimal number.
 */
export function readLineItem(el: Element): LineItem {
  expectRoot(el, "LineItem");
  const reader = new ChildReader(el);

  const categoryId = reader.text("CategoryId");
  const productId = reader.text("ProductId");
  const itemId = reader.text("ItemId");
  const lineNumText = reader.text("LineNum");
  const quantityText = reader.text("Quantity");
  const unitPrice = reader.text("UnitPrice");
  reader.end();

  if (!INTEGER_PATTERN.test(lineNumText)) {
    throw new DocumentReadError("LineNum element: integer expected.");
  }
  if (!INTEGER_PATTERN.test(quantityText)) {
    throw new DocumentReadError("Quantity element: integer expected.");
  }
  if (!DECIMAL_PATTERN.test(unitPrice)) {
    throw new DocumentReadError("UnitPrice element: decimal number expected.");
  }

  return {
    categoryId,
    productId,
    itemId,
    lineNum: Number(lineNumText),
    quantity: Number(quantityText),
    unitPrice,
  };
}

/**
 * SWHR-R-0032: drops the shipped quantity when a stored line item is
 * exported for document exchange.
 */
export function toExportLineItem(line: StoredLineItem): LineItem {
  return {
    categoryId: line.categoryId,
    productId: line.productId,
    itemId: line.itemId,
    lineNum: line.lineNum,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
  };
}
