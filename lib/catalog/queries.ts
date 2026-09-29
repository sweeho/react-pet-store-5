import { and, asc, eq, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { db } from "../../db/client";
import {
  category,
  categoryDetails,
  item,
  itemDetails,
  product,
  productDetails,
} from "../../db/schema";
import type { LocaleId } from "../locale/model";
import { toCatalogError } from "./errors";
import { buildPage, type Page } from "./paging";

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

const ITEM_ROW_COLUMNS = {
  itemId: item.id,
  productId: item.productId,
  categoryId: product.categoryId,
  productName: productDetails.name,
  name: itemDetails.name,
  description: itemDetails.description,
  image: itemDetails.image,
  listPrice: itemDetails.listPrice,
  unitCost: itemDetails.unitCost,
  locale: itemDetails.locale,
  attr1: itemDetails.attr1,
  attr2: itemDetails.attr2,
  attr3: itemDetails.attr3,
  attr4: itemDetails.attr4,
  attr5: itemDetails.attr5,
};

interface ItemRow {
  itemId: string;
  productId: string;
  categoryId: string;
  productName: string;
  name: string;
  description: string;
  image: string;
  listPrice: number;
  unitCost: number;
  locale: string;
  attr1: string | null;
  attr2: string | null;
  attr3: string | null;
  attr4: string | null;
  attr5: string | null;
}

function toItemView(row: ItemRow): ItemView {
  const { attr1, attr2, attr3, attr4, attr5, ...rest } = row;
  return { ...rest, attributes: [attr1, attr2, attr3, attr4, attr5] };
}

/**
 * Every item read inner-joins item details AND product details in the same
 * locale (D4, SWHR-R-0014/SWHR-R-0087): a row missing in either means the
 * item does not exist in that locale, never a fallback to another locale.
 * The join against `product` (not just `productDetails`) is what recovers
 * the correct category id (D4 — the legacy DAO swapped it).
 */
function itemRowsQuery(productId: string, locale: LocaleId) {
  return db
    .select(ITEM_ROW_COLUMNS)
    .from(item)
    .innerJoin(itemDetails, and(eq(itemDetails.itemId, item.id), eq(itemDetails.locale, locale)))
    .innerJoin(
      productDetails,
      and(eq(productDetails.productId, item.productId), eq(productDetails.locale, locale)),
    )
    .innerJoin(product, eq(product.id, item.productId))
    .where(eq(item.productId, productId))
    .orderBy(asc(item.id));
}

export function getProduct(productId: string, locale: LocaleId): ProductView | null {
  try {
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
  } catch (error) {
    throw toCatalogError(error);
  }
}

export function listProductItems(productId: string, locale: LocaleId): ItemView[] {
  try {
    return itemRowsQuery(productId, locale)
      .all()
      .map((row) => toItemView(row));
  } catch (error) {
    throw toCatalogError(error);
  }
}

export function getItem(itemId: string, locale: LocaleId): ItemView | null {
  try {
    const row = db
      .select(ITEM_ROW_COLUMNS)
      .from(item)
      .innerJoin(itemDetails, and(eq(itemDetails.itemId, item.id), eq(itemDetails.locale, locale)))
      .innerJoin(
        productDetails,
        and(eq(productDetails.productId, item.productId), eq(productDetails.locale, locale)),
      )
      .innerJoin(product, eq(product.id, item.productId))
      .where(eq(item.id, itemId))
      .get();

    return row ? toItemView(row) : null;
  } catch (error) {
    throw toCatalogError(error);
  }
}

/**
 * Categories with details in the requested locale (SWHR-R-0087/0088),
 * ordered by localized name then id (design.md Q8) — a category missing a
 * details row in this locale is omitted, never substituted.
 */
export function listCategories(locale: LocaleId): CategoryView[] {
  try {
    return db
      .select({
        categoryId: category.id,
        name: categoryDetails.name,
        description: categoryDetails.description,
        image: categoryDetails.image,
        locale: categoryDetails.locale,
      })
      .from(category)
      .innerJoin(
        categoryDetails,
        and(eq(categoryDetails.categoryId, category.id), eq(categoryDetails.locale, locale)),
      )
      .orderBy(asc(categoryDetails.name), asc(category.id))
      .all();
  } catch (error) {
    throw toCatalogError(error);
  }
}

export function getCategory(categoryId: string, locale: LocaleId): CategoryView | null {
  try {
    const row = db
      .select({
        categoryId: category.id,
        name: categoryDetails.name,
        description: categoryDetails.description,
        image: categoryDetails.image,
        locale: categoryDetails.locale,
      })
      .from(category)
      .innerJoin(
        categoryDetails,
        and(eq(categoryDetails.categoryId, category.id), eq(categoryDetails.locale, locale)),
      )
      .where(eq(category.id, categoryId))
      .get();

    return row ?? null;
  } catch (error) {
    throw toCatalogError(error);
  }
}

/**
 * Products of a category with details in the requested locale
 * (SWHR-R-0087/0089), ordered by localized name then id (Q8). An unknown
 * category simply joins to zero rows — an empty page, never an error
 * (SD6/SWHR-R-0089.02).
 */
export function listProducts(
  categoryId: string,
  locale: LocaleId,
  start: number,
  count: number,
): Page<ProductView> {
  try {
    if (start < 0) {
      return buildPage<ProductView>([], start, count);
    }

    const rows = db
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
      .where(eq(product.categoryId, categoryId))
      .orderBy(asc(productDetails.name), asc(product.id))
      .limit(count + 1)
      .offset(start)
      .all();

    return buildPage(rows, start, count);
  } catch (error) {
    throw toCatalogError(error);
  }
}

/**
 * Items of a product with details in the requested locale (SWHR-R-0090),
 * ordered by item id (Q8 — no natural order exists, so a stable tiebreak is
 * applied). A negative start never reaches SQLite: SQLite treats a negative
 * OFFSET as zero, which would not match SWHR-R-0094's "empty page" rule.
 */
export function listItems(
  productId: string,
  locale: LocaleId,
  start: number,
  count: number,
): Page<ItemView> {
  try {
    if (start < 0) {
      return buildPage<ItemView>([], start, count);
    }

    const rows = itemRowsQuery(productId, locale)
      .limit(count + 1)
      .offset(start)
      .all();

    return buildPage(
      rows.map((row) => toItemView(row)),
      start,
      count,
    );
  } catch (error) {
    throw toCatalogError(error);
  }
}

/**
 * Splits a query into de-duplicated whitespace-separated keywords
 * (SWHR-R-0092). A blank or whitespace-only query yields no keywords, which
 * `searchItems` treats as "don't query the catalog at all".
 */
export function parseKeywords(query: string): string[] {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);

  return Array.from(new Set(tokens));
}

// `%` and `_` are LIKE wildcards in SQLite; a literal occurrence in a
// keyword must not act as one (design.md PLAN step 6).
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * One OR group per keyword (design.md, legacy SEARCH_ITEMS): the keyword,
 * lower-cased, as a substring of the localized product name, the category
 * identifier or the localized item description (SWHR-R-0093, D3 — matching
 * is case-insensitive; Q1 — the category identifier, not its localized
 * name).
 */
function keywordCondition(keyword: string): SQL {
  const pattern = `%${escapeLikePattern(keyword.toLowerCase())}%`;

  return or(
    sql`lower(${productDetails.name}) LIKE ${pattern} ESCAPE '\\'`,
    sql`lower(${product.categoryId}) LIKE ${pattern} ESCAPE '\\'`,
    sql`lower(${itemDetails.description}) LIKE ${pattern} ESCAPE '\\'`,
  )!;
}

/**
 * Keyword search over items with details in the requested locale
 * (SWHR-R-0092/0093), ordered by item id (Q8). A blank query answers an
 * empty page without touching the catalog store (SWHR-R-0092.02).
 */
export function searchItems(
  query: string,
  locale: LocaleId,
  start: number,
  count: number,
): Page<ItemView> & { keywords: string[] } {
  const keywords = parseKeywords(query);

  if (keywords.length === 0) {
    return { ...buildPage<ItemView>([], start, count), keywords };
  }

  try {
    if (start < 0) {
      return { ...buildPage<ItemView>([], start, count), keywords };
    }

    const rows = db
      .select(ITEM_ROW_COLUMNS)
      .from(item)
      .innerJoin(itemDetails, and(eq(itemDetails.itemId, item.id), eq(itemDetails.locale, locale)))
      .innerJoin(
        productDetails,
        and(eq(productDetails.productId, item.productId), eq(productDetails.locale, locale)),
      )
      .innerJoin(product, eq(product.id, item.productId))
      .where(or(...keywords.map((keyword) => keywordCondition(keyword))))
      .orderBy(asc(item.id))
      .limit(count + 1)
      .offset(start)
      .all();

    return {
      ...buildPage(
        rows.map((row) => toItemView(row)),
        start,
        count,
      ),
      keywords,
    };
  } catch (error) {
    throw toCatalogError(error);
  }
}
