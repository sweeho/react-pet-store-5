import { eq } from "drizzle-orm";
import type { H3Event } from "nitro/h3";

import { db } from "../../db/client";
import { sessions } from "../../db/schema";
import { getCustomerAccount } from "../account/customer";
import { requireSignOn } from "../auth/protection";
import { writePurchaseOrder, type PurchaseOrder } from "../b2b/documents/purchaseOrder";
import { emptyCart, getCart, listCartLines } from "../cart/lines";
import { EmptyCartFailure, GeneralFailure, MissingFormDataFailure } from "../errors/failures";
import { nextId, ORDER_ID_PREFIX } from "../ids/counter";
import { enqueue } from "../messaging/outbox";
import { minorToDecimal } from "../orders/money";
import { orderCardFromAccount } from "./card";
import { type OrderForm, validateOrderContacts } from "./contact";

/**
 * Turns the session's cart and the submitted form into one purchase order on
 * the outbox. Id, enqueue, cart clearing and the last-order record share one
 * transaction, so any failure leaves all of them untouched.
 */
export async function placeOrder(
  event: H3Event,
  form: OrderForm,
  opts: { now?: Date } = {},
): Promise<{ orderId: string; email: string }> {
  const session = await requireSignOn(event);
  const { billing, shipping } = validateOrderContacts(form);

  const account = session.userId ? getCustomerAccount(session.userId) : null;
  if (!session.userId || !account) throw new GeneralFailure("No account for this user");

  const cart = await getCart(event, session.id);
  if (cart.lines.length === 0) throw new EmptyCartFailure("The cart is empty");

  const email = billing.email || account.contactInfo.email;
  // Order intake requires a non-empty EmailId, so an order with no address is never queued.
  if (!email) throw new MissingFormDataFailure(["billing.email"]);
  const orderDate = opts.now ?? new Date();
  const creditCard = orderCardFromAccount(account.creditCard);
  const userId = session.userId;

  const orderId = db.transaction((tx) => {
    if (listCartLines(session.id).length === 0) throw new EmptyCartFailure("The cart is empty");

    const id = nextId(ORDER_ID_PREFIX, tx);
    const po: PurchaseOrder = {
      locale: cart.locale,
      orderId: id,
      userId,
      emailId: email,
      orderDate,
      shippingInfo: shipping,
      billingInfo: billing,
      totalPrice: minorToDecimal(cart.subtotal, cart.locale),
      creditCard,
      lineItems: cart.lines.map((line, lineNum) => ({
        categoryId: line.categoryId,
        productId: line.productId,
        itemId: line.itemId,
        lineNum,
        quantity: line.quantity,
        unitPrice: minorToDecimal(line.unitCost, cart.locale),
      })),
    };
    enqueue(tx, "opc.purchase-order", writePurchaseOrder(po));
    emptyCart(session.id, tx);
    tx.update(sessions)
      .set({ lastOrderId: id, lastOrderEmail: email })
      .where(eq(sessions.id, session.id))
      .run();
    return id;
  });

  return { orderId, email };
}
