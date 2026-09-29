import { and, asc, eq } from "drizzle-orm";
import type { H3Event } from "nitro/h3";

import { db } from "../../db/client";
import { cartLines, item } from "../../db/schema";
import { getCartItemDetails } from "../catalog/cart";
import { getCartLocale } from "../locale/session";
import type { CartLine, CartView } from "./types";

const INT32_MIN = -(2 ** 31);
const INT32_MAX = 2 ** 31 - 1;

function itemExists(itemId: string): boolean {
  return db.select({ id: item.id }).from(item).where(eq(item.id, itemId)).get() !== undefined;
}

function setLineQuantity(sessionId: string, itemId: string, quantity: number): void {
  const existing = db
    .select({ id: cartLines.id })
    .from(cartLines)
    .where(and(eq(cartLines.sessionId, sessionId), eq(cartLines.itemId, itemId)))
    .get();

  if (existing) {
    db.update(cartLines).set({ quantity }).where(eq(cartLines.id, existing.id)).run();
    return;
  }
  db.insert(cartLines).values({ sessionId, itemId, quantity, addedAt: new Date() }).run();
}

/**
 * One line per item, quantity reset to 1 (SWHR-R-0135, P1 — a repeat add does
 * not increment, and the line keeps its position). Returns false, storing
 * nothing, for an id that is not in the catalog (P6).
 */
export function addCartItem(sessionId: string, itemId: string): boolean {
  if (!itemExists(itemId)) {
    return false;
  }
  setLineQuantity(sessionId, itemId, 1);
  return true;
}

export function removeCartItem(sessionId: string, itemId: string): void {
  db.delete(cartLines)
    .where(and(eq(cartLines.sessionId, sessionId), eq(cartLines.itemId, itemId)))
    .run();
}

/** P5: a 32-bit integer or its decimal string; everything else is 0. */
export function parseQuantity(value: unknown): number {
  let parsed: number;
  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string" && /^-?\d+$/.test(value)) {
    parsed = Number(value);
  } else {
    return 0;
  }
  return Number.isInteger(parsed) && parsed >= INT32_MIN && parsed <= INT32_MAX ? parsed : 0;
}

/**
 * Batch update (SWHR-R-0137): a quantity above 0 sets the line (adding it if
 * absent), anything else removes it. Ids outside the catalog are ignored (P6).
 */
export function updateCartQuantities(sessionId: string, quantities: Record<string, unknown>): void {
  for (const [itemId, raw] of Object.entries(quantities)) {
    const quantity = parseQuantity(raw);
    if (quantity > 0) {
      if (itemExists(itemId)) {
        setLineQuantity(sessionId, itemId, quantity);
      }
    } else {
      removeCartItem(sessionId, itemId);
    }
  }
}

export function listCartLines(sessionId: string): { itemId: string; quantity: number }[] {
  return db
    .select({ itemId: cartLines.itemId, quantity: cartLines.quantity })
    .from(cartLines)
    .where(eq(cartLines.sessionId, sessionId))
    .orderBy(asc(cartLines.addedAt), asc(cartLines.id))
    .all();
}

/** Stored lines, including any that no longer resolve (P3). */
export function countCartLines(sessionId: string): number {
  return listCartLines(sessionId).length;
}

/** `tx` lets checkout empty the cart inside its order transaction (P9). */
export function emptyCart(sessionId: string, tx: Pick<typeof db, "delete"> = db): void {
  tx.delete(cartLines).where(eq(cartLines.sessionId, sessionId)).run();
}

// Ending a storefront session deletes its lines (P4, P9) — exported for
// lib/auth/session.ts, which owns when a session ends.
export function deleteCartLinesForSession(sessionId: string): void {
  emptyCart(sessionId);
}

/**
 * The cart resolved against the catalog at read time (SWHR-R-0141). A line
 * whose item has no details in the cart locale is left out of `lines` and
 * `subtotal` but still counts (SWHR-R-0142).
 */
export async function getCart(event: H3Event, sessionId: string): Promise<CartView> {
  const stored = listCartLines(sessionId);
  const locale = await getCartLocale(event);
  const details = await getCartItemDetails(
    event,
    stored.map((line) => line.itemId),
  );
  const detailById = new Map(details.map((detail) => [detail.itemId, detail]));

  const lines = stored.flatMap((line): CartLine[] => {
    const detail = detailById.get(line.itemId);
    if (!detail) {
      return [];
    }
    return [
      {
        itemId: detail.itemId,
        productId: detail.productId,
        categoryId: detail.categoryId,
        productName: detail.productName,
        name: detail.name,
        attribute: detail.attributes[0] ?? null,
        quantity: line.quantity,
        unitCost: detail.listPrice,
        lineTotal: line.quantity * detail.listPrice,
      },
    ];
  });

  return {
    lines,
    count: stored.length,
    subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    locale,
  };
}
