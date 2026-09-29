import type { LocaleId } from "../locale/model";

/**
 * One stored cart line resolved against the catalog (design.md P3).
 * Every money field is an integer in minor units of `CartView.locale`;
 * `unitCost` is the list price (P2).
 */
export interface CartLine {
  itemId: string;
  productId: string;
  categoryId: string;
  productName: string;
  name: string;
  /** The first attribute (`attributes[0]`), the legacy `attr1`. */
  attribute: string | null;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

/** What every cart route answers (P3, P7). */
export interface CartView {
  lines: CartLine[];
  /** Number of stored lines, including unresolvable ones. */
  count: number;
  /** Sum of `lineTotal` over resolved lines only, in minor units. */
  subtotal: number;
  locale: LocaleId;
}

/** The cart a session has before its first line is stored. */
export function emptyCartView(locale: LocaleId): CartView {
  return { lines: [], count: 0, subtotal: 0, locale };
}
