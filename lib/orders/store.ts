import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import {
  orderAddresses,
  orderCards,
  orderContacts,
  orderLines,
  purchaseOrders,
} from "../../db/schema";
import type { Executor } from "../account/types";
import type { PurchaseOrder } from "../b2b/documents/purchaseOrder";
import { decimalToMinor } from "./money";

export interface StoredOrder {
  orderId: string;
  userId: string;
  emailId: string;
  orderDate: Date;
  locale: string;
  totalValue: number;
  status: string;
  contact: { givenName: string; familyName: string; telephone: string; email: string | null };
  address: {
    streetName1: string;
    streetName2: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  card: { cardNumber: string; cardType: string; expiryDate: string };
  lines: {
    lineNum: number;
    categoryId: string;
    productId: string;
    itemId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

/**
 * Stores the order as a snapshot (OQ-5: only the shipping contact is kept;
 * billing travels in the document). `totalValue` is the supplied total,
 * never recomputed from the lines. A second call with the same `orderId`
 * does nothing and returns false, which gives exactly-once delivery.
 */
export function persistPurchaseOrder(tx: Executor, po: PurchaseOrder): boolean {
  const existing = tx
    .select({ orderId: purchaseOrders.orderId })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.orderId, po.orderId))
    .get();
  if (existing) return false;

  tx.insert(purchaseOrders)
    .values({
      orderId: po.orderId,
      userId: po.userId,
      emailId: po.emailId,
      orderDate: po.orderDate,
      locale: po.locale,
      totalValue: decimalToMinor(po.totalPrice, po.locale),
      createdAt: new Date(),
    })
    .run();

  const { address, ...contact } = po.shippingInfo;
  const contactRow = tx
    .insert(orderContacts)
    .values({
      orderId: po.orderId,
      givenName: contact.givenName,
      familyName: contact.familyName,
      telephone: contact.phone,
      email: contact.email,
    })
    .returning({ id: orderContacts.id })
    .get();
  tx.insert(orderAddresses)
    .values({
      contactId: contactRow.id,
      streetName1: address.streetName1,
      streetName2: address.streetName2 ?? null,
      city: address.city ?? "",
      state: address.state ?? "",
      zipCode: address.zipCode ?? "",
      country: address.country ?? "",
    })
    .run();
  tx.insert(orderCards)
    .values({
      orderId: po.orderId,
      cardNumber: po.creditCard.cardNumber,
      cardType: po.creditCard.cardType,
      expiryDate: po.creditCard.expiryDate,
    })
    .run();
  for (const line of po.lineItems) {
    tx.insert(orderLines)
      .values({
        orderId: po.orderId,
        lineNum: line.lineNum,
        categoryId: line.categoryId,
        productId: line.productId,
        itemId: line.itemId,
        quantity: line.quantity,
        unitPrice: decimalToMinor(line.unitPrice, po.locale),
      })
      .run();
  }
  return true;
}

export function getStoredOrder(orderId: string, tx: Executor = db): StoredOrder | null {
  const order = tx.select().from(purchaseOrders).where(eq(purchaseOrders.orderId, orderId)).get();
  if (!order) return null;

  const contact = tx.select().from(orderContacts).where(eq(orderContacts.orderId, orderId)).get();
  const card = tx.select().from(orderCards).where(eq(orderCards.orderId, orderId)).get();
  const address = contact
    ? tx.select().from(orderAddresses).where(eq(orderAddresses.contactId, contact.id)).get()
    : undefined;
  if (!contact || !address || !card) {
    throw new Error(`Stored order ${orderId}: missing contact, address or card row.`);
  }
  const lines = tx
    .select()
    .from(orderLines)
    .where(eq(orderLines.orderId, orderId))
    .orderBy(orderLines.lineNum)
    .all();

  return {
    orderId: order.orderId,
    userId: order.userId,
    emailId: order.emailId,
    orderDate: order.orderDate,
    locale: order.locale,
    totalValue: order.totalValue,
    status: order.status,
    contact: {
      givenName: contact.givenName,
      familyName: contact.familyName,
      telephone: contact.telephone,
      email: contact.email,
    },
    address: {
      streetName1: address.streetName1,
      streetName2: address.streetName2,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
    },
    card: { cardNumber: card.cardNumber, cardType: card.cardType, expiryDate: card.expiryDate },
    lines: lines.map((l) => ({
      lineNum: l.lineNum,
      categoryId: l.categoryId,
      productId: l.productId,
      itemId: l.itemId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    })),
  };
}
