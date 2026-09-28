import { and, eq } from "drizzle-orm";

import { db } from "../../db/client";
import { item, itemDetails, product, productDetails } from "../../db/schema";
import type { LocaleId } from "../locale/model";

export interface ProductView {
  productId: string;
  categoryId: string;
  name: string;
  description: string | null;
  image: string | null;
  locale: LocaleId;
}

export interface ItemView {
  itemId: string;
  productId: string;
  name: string;
  description: string;
  image: string;
  listPrice: number;
  unitCost: number;
  locale: LocaleId;
}

const ITEM_VIEW_COLUMNS = {
  itemId: item.id,
  productId: item.productId,
  name: itemDetails.name,
  description: itemDetails.description,
  image: itemDetails.image,
  listPrice: itemDetails.listPrice,
  unitCost: itemDetails.unitCost,
  locale: itemDetails.locale,
};

/**
 * Every query below filters by locale and joins on that same locale (D4,
 * SWHR-R-0014): a row missing in the requested locale means "not found",
 * never a fallback to another locale.
 */
export function getProduct(productId: string, locale: LocaleId): ProductView | null {
  const row = db
    .select({
      productId: product.id,
      categoryId: product.categoryId,
      name: productDetails.name,
      description: productDetails.description,
      image: productDetails.image,
      locale: productDetails.locale,
    })
    .from(product)
    .innerJoin(
      productDetails,
      and(eq(productDetails.productId, product.id), eq(productDetails.locale, locale)),
    )
    .where(eq(product.id, productId))
    .get();

  return row ?? null;
}

/**
 * An item is listed only when both its own details AND its product's
 * details exist in this same locale (SWHR-R-0014.03) — the join against
 * `productDetails` is what excludes an item whose product lacks the locale,
 * even when the item's own row for that locale exists.
 */
export function listProductItems(productId: string, locale: LocaleId): ItemView[] {
  return db
    .select(ITEM_VIEW_COLUMNS)
    .from(item)
    .innerJoin(itemDetails, and(eq(itemDetails.itemId, item.id), eq(itemDetails.locale, locale)))
    .innerJoin(
      productDetails,
      and(eq(productDetails.productId, item.productId), eq(productDetails.locale, locale)),
    )
    .where(eq(item.productId, productId))
    .all();
}

export function getItem(itemId: string, locale: LocaleId): ItemView | null {
  const row = db
    .select(ITEM_VIEW_COLUMNS)
    .from(item)
    .innerJoin(itemDetails, and(eq(itemDetails.itemId, item.id), eq(itemDetails.locale, locale)))
    .innerJoin(
      productDetails,
      and(eq(productDetails.productId, item.productId), eq(productDetails.locale, locale)),
    )
    .where(eq(item.id, itemId))
    .get();

  return row ?? null;
}
