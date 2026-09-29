import { eq } from "drizzle-orm";

import { db } from "../../../db/client";
import type { Executor } from "../../account/types";
import {
  supplierAddresses,
  supplierContacts,
  supplierLineItems,
  supplierOrders,
} from "../../../db/schema";
import type { ContactInfo } from "../elements/contactInfo";

export interface SupplierOrderLineItem {
  categoryId: string;
  productId: string;
  itemId: string;
  lineNum: number;
  quantity: number;
  unitPrice: number;
  quantityShipped: number;
}

export interface SupplierOrderRecord {
  orderId: string;
  orderDate: Date;
  status: string;
  shippingInfo: ContactInfo;
  lineItems: SupplierOrderLineItem[];
}

/**
 * SWHR-R-0071: no role or session check — access control on supplier-order
 * data is enforced by the calling application, not this data layer, and
 * this function is reachable only from inside the application (design.md
 * §Mapping to the rebuild stack).
 */
export function getSupplierOrder(orderId: string, tx: Executor = db): SupplierOrderRecord | null {
  const order = tx.select().from(supplierOrders).where(eq(supplierOrders.orderId, orderId)).get();
  if (!order) {
    return null;
  }

  const contact = tx
    .select()
    .from(supplierContacts)
    .where(eq(supplierContacts.orderId, orderId))
    .get();
  const address = tx
    .select()
    .from(supplierAddresses)
    .where(eq(supplierAddresses.orderId, orderId))
    .get();
  const lineItems = tx
    .select()
    .from(supplierLineItems)
    .where(eq(supplierLineItems.orderId, orderId))
    .orderBy(supplierLineItems.lineNum)
    .all();

  if (!contact || !address) {
    throw new Error(`Supplier order ${orderId}: missing contact or address row.`);
  }

  return {
    orderId: order.orderId,
    orderDate: order.orderDate,
    status: order.status,
    shippingInfo: {
      familyName: contact.familyName,
      givenName: contact.givenName,
      email: contact.email,
      phone: contact.phone,
      address: {
        streetName1: address.streetName1,
        streetName2: address.streetName2,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
      },
    },
    lineItems: lineItems.map((line) => ({
      categoryId: line.categoryId,
      productId: line.productId,
      itemId: line.itemId,
      lineNum: line.lineNum,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      quantityShipped: line.quantityShipped,
    })),
  };
}

/** SWHR-R-0071 (see `getSupplierOrder`): no role or session check. */
export function listSupplierOrders(): SupplierOrderRecord[] {
  return db
    .select()
    .from(supplierOrders)
    .all()
    .map((order) => getSupplierOrder(order.orderId))
    .filter((record): record is SupplierOrderRecord => record !== null);
}

export function listSupplierOrderIdsByStatus(status: string): string[] {
  return db
    .select({ orderId: supplierOrders.orderId })
    .from(supplierOrders)
    .where(eq(supplierOrders.status, status))
    .orderBy(supplierOrders.orderId)
    .all()
    .map((r) => r.orderId);
}
