import type { Handler, Tx } from "../../messaging/outbox";
import {
  supplierAddresses,
  supplierContacts,
  supplierLineItems,
  supplierOrders,
} from "../../../db/schema";
import type { SupplierOrder } from "../documents/supplierOrder";
import { intakeSupplierOrder } from "../partner/supplierOrderIntake";
import type { PartnerInvoice } from "../partner/tpaInvoice";
import { publishInvoices } from "./invoiceChannel";

// Exact string arithmetic (design.md P2) — never parseFloat, which would
// round-trip the decimal string through IEEE 754 and risk drifting the
// persisted cents away from what the document actually said (R8).
function unitPriceToCents(unitPrice: string): number {
  const negative = unitPrice.startsWith("-");
  const magnitude = negative ? unitPrice.slice(1) : unitPrice;
  const [whole, fraction = ""] = magnitude.split(".");
  const cents = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0").slice(0, 2) || "0");
  return negative ? -cents : cents;
}

function persistSupplierOrder(tx: Tx, order: SupplierOrder): void {
  tx.insert(supplierOrders)
    .values({
      orderId: order.orderId,
      orderDate: order.orderDate,
      status: "PENDING",
      createdAt: new Date(),
    })
    .run();

  tx.insert(supplierContacts)
    .values({
      orderId: order.orderId,
      familyName: order.shippingInfo.familyName,
      givenName: order.shippingInfo.givenName,
      email: order.shippingInfo.email,
      phone: order.shippingInfo.phone,
    })
    .run();

  tx.insert(supplierAddresses)
    .values({
      orderId: order.orderId,
      streetName1: order.shippingInfo.address.streetName1,
      streetName2: order.shippingInfo.address.streetName2 ?? null,
      city: order.shippingInfo.address.city ?? "",
      state: order.shippingInfo.address.state ?? "",
      zipCode: order.shippingInfo.address.zipCode ?? "",
      country: order.shippingInfo.address.country ?? "",
    })
    .run();

  for (const item of order.lineItems) {
    tx.insert(supplierLineItems)
      .values({
        orderId: order.orderId,
        categoryId: item.categoryId,
        productId: item.productId,
        itemId: item.itemId,
        lineNum: item.lineNum,
        quantity: item.quantity,
        unitPrice: unitPriceToCents(item.unitPrice),
        quantityShipped: 0,
      })
      .run();
  }
}

/**
 * SWHR-R-0050: the message is processed as a single unit. Prepare —
 * `intakeSupplierOrder`, run before any transaction opens — parses and (for
 * a partner-format document, per SWHR-R-0047) validates the order; a
 * `MalformedDocumentError` or `DocumentInvalidError` fails the delivery
 * with nothing ever written. Commit — persisting the order and publishing
 * whatever `shipOnReceipt` returns (default: nothing) — runs inside the
 * dispatcher's single transaction, so a failure publishing an invoice (the
 * channel's `enqueue` throwing) rolls back the order insert too, and the
 * message is redelivered.
 */
export function createSupplierIntakeHandler(opts?: {
  shipOnReceipt?: (tx: Tx, order: SupplierOrder) => PartnerInvoice[];
}): Handler {
  const shipOnReceipt = opts?.shipOnReceipt ?? (() => []);

  return async (payload: string) => {
    const order = await intakeSupplierOrder(payload);

    return (tx: Tx) => {
      persistSupplierOrder(tx, order);
      const invoices = shipOnReceipt(tx, order);
      if (invoices.length > 0) {
        publishInvoices(tx, invoices);
      }
    };
  };
}
