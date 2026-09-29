import { and, eq } from "drizzle-orm";

import { db } from "../../db/client";
import { product, productDetails } from "../../db/schema";
import type { LocaleId } from "../locale/model";
import type { Page } from "./paging";

export interface CategoryView {
  categoryId: string;
  name: string;
  description: string | null;
  image: string | null;
  locale: LocaleId;
}

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
  categoryId: string;
  productName: string;
  name: string;
  description: string;
  image: string;
  /** Always length 5; an unset attribute is null (D4, SD2). */
  attributes: (string | null)[];
  listPrice: number;
  unitCost: number;
  locale: LocaleId;
}

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

export function listProductItems(productId: string, locale: LocaleId): ItemView[] {
  void productId;
  void locale;
  throw new Error("VortexNotImplemented");
}

export function getItem(itemId: string, locale: LocaleId): ItemView | null {
  void itemId;
  void locale;
  throw new Error("VortexNotImplemented");
}

export function listCategories(locale: LocaleId): CategoryView[] {
  void locale;
  throw new Error("VortexNotImplemented");
}

export function getCategory(categoryId: string, locale: LocaleId): CategoryView | null {
  void categoryId;
  void locale;
  throw new Error("VortexNotImplemented");
}

export function listProducts(
  categoryId: string,
  locale: LocaleId,
  start: number,
  count: number,
): Page<ProductView> {
  void categoryId;
  void locale;
  void start;
  void count;
  throw new Error("VortexNotImplemented");
}

export function listItems(
  productId: string,
  locale: LocaleId,
  start: number,
  count: number,
): Page<ItemView> {
  void productId;
  void locale;
  void start;
  void count;
  throw new Error("VortexNotImplemented");
}

export function parseKeywords(query: string): string[] {
  void query;
  throw new Error("VortexNotImplemented");
}

export function searchItems(
  query: string,
  locale: LocaleId,
  start: number,
  count: number,
): Page<ItemView> & { keywords: string[] } {
  void query;
  void locale;
  void start;
  void count;
  throw new Error("VortexNotImplemented");
}
