import { enqueue, type Tx } from "../../messaging/outbox";
import { buildPartnerInvoice, type PartnerInvoice } from "../partner/tpaInvoice";

/**
 * SWHR-R-0049/SWHR-R-0051: one invoice message per shipment, published on
 * `opc.invoice` — a fan-out channel with two fixed subscribers
 * (`order-fulfillment`, `customer-notification`), each getting its own
 * delivery row from a single `enqueue` call.
 */
export function publishInvoices(tx: Tx, invoices: PartnerInvoice[]): void {
  for (const invoice of invoices) {
    enqueue(tx, "opc.invoice", buildPartnerInvoice(invoice));
  }
}
