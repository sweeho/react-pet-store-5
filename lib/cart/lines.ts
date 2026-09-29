/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs, removed at green */
import { and, eq } from "drizzle-orm";
import type { H3Event } from "nitro/h3";

import { db } from "../../db/client";
import { cartLines } from "../../db/schema";
import { getCartItemDetails } from "../catalog/cart";
import type { ItemView } from "../catalog/queries";
import type { CartView } from "./types";

/** +1, one line per item (design.md P9) — a repeat add increments the existing line. */
export function addCartItem(sessionId: string, itemId: string): void {
  const existing = db
    .select()
    .from(cartLines)
    .where(and(eq(cartLines.sessionId, sessionId), eq(cartLines.itemId, itemId)))
    .get();

  if (existing) {
    db.update(cartLines)
      .set({ quantity: existing.quantity + 1 })
      .where(eq(cartLines.id, existing.id))
      .run();
    return;
  }

  db.insert(cartLines).values({ sessionId, itemId, quantity: 1, addedAt: new Date() }).run();
}

export function listCartLines(sessionId: string): { itemId: string; quantity: number }[] {
  return db
    .select({ itemId: cartLines.itemId, quantity: cartLines.quantity })
    .from(cartLines)
    .where(eq(cartLines.sessionId, sessionId))
    .all();
}

// Ending a storefront session deletes its lines (P4, P9) — exported for
// lib/auth/session.ts, which owns when a session ends.
export function deleteCartLinesForSession(sessionId: string): void {
  db.delete(cartLines).where(eq(cartLines.sessionId, sessionId)).run();
}

export function removeCartItem(_sessionId: string, _itemId: string): void {
  throw new Error("VortexNotImplemented");
}

export function parseQuantity(_value: unknown): number {
  throw new Error("VortexNotImplemented");
}

export function updateCartQuantities(
  _sessionId: string,
  _quantities: Record<string, unknown>,
): void {
  throw new Error("VortexNotImplemented");
}

export function countCartLines(_sessionId: string): number {
  throw new Error("VortexNotImplemented");
}

export function emptyCart(_sessionId: string, _tx?: unknown): void {
  throw new Error("VortexNotImplemented");
}

export async function getCart(_event: H3Event, _sessionId: string): Promise<CartView> {
  throw new Error("VortexNotImplemented");
}

export interface CartLineView {
  itemId: string;
  quantity: number;
  item: ItemView;
}

/**
 * `GET /api/cart` and `POST /api/cart/items` both answer with lines merged
 * with their item details (§HTTP surface). A line whose item no longer
 * resolves in the cart's locale is dropped rather than surfaced half-built.
 */
export async function getCartWithDetails(
  event: H3Event,
  sessionId: string,
): Promise<CartLineView[]> {
  const lines = listCartLines(sessionId);
  const items = await getCartItemDetails(
    event,
    lines.map((line) => line.itemId),
  );
  const itemById = new Map(items.map((item) => [item.itemId, item]));

  return lines.flatMap((line) => {
    const item = itemById.get(line.itemId);
    return item ? [{ itemId: line.itemId, quantity: line.quantity, item }] : [];
  });
}
