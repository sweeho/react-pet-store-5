# Design: shopping-cart (extracted from Java Pet Store 1.3.2)

## Context

In the legacy application the cart is a stateful session bean (`ShoppingCartEJB`, component `src/components/cart`). It holds a `HashMap<itemId, Integer quantity>` and is reached through a per-HTTP-session facade (`ShoppingClientFacadeLocalEJB`) that creates it lazily. Nothing is persisted. The web tier (`src/apps/petstore`) turns `cart.do?action=purchase|remove|update` into cart events, and `cart.jsp` renders the cart. The requirements are in `specs/shopping-cart/spec.md`. This file records where each rule came from and what the rebuild must decide.

The IR contained 16 records under `shopping-cart`, 1 of them a screen. Pass A and pass B agreed on every value. They differed only on confidence grading for the subtotal, which pass B marked disputed (see OQ-2).

## Legacy flow (implementation notes, not requirements)

| Behaviour     | Legacy location                                                                                                             | Note                                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Add item      | `CartHTMLAction` (`action=purchase`, `itemId`) → `CartEJBAction` ADD_ITEM → `ShoppingCartLocalEJB.addItem(String)` L111-113 | `cart.put(id, 1)`: overwrites the existing quantity                                                                                   |
| Remove item   | `action=remove` → DELETE_ITEM → `deleteItem`                                                                                | `Map.remove`: absent id is a no-op                                                                                                    |
| Batch update  | `action=update`, one `itemQuantity_<itemId>` parameter per line → UPDATE_ITEMS → `updateItemQuantity` L123-127 per entry    | The non-integer value is replaced by 0 in `CartHTMLAction` L107-118. The bean removes the entry, then re-inserts it only if `qty > 0` |
| Count         | `getCount()` L129-131 = `cart.size()`                                                                                       | Distinct ids, including unresolvable ones                                                                                             |
| Listing       | `getItems()` L83-109: `CatalogHelper.getItem(id, locale)` per id                                                            | `CatalogException` is printed to stdout and the line is skipped                                                                       |
| Subtotal      | `getSubTotal()` L133-144: Σ `listCost * qty` in a Java `double`                                                             | No rounding. `cart.jsp` formats with `fmt:formatNumber type="currency"` after forcing `fmt:setLocale en_US`                           |
| Empty         | `empty()`, called by `OrderEJBAction` after order placement                                                                 | The `CartEvent.EMPTY` type is declared but never produced or handled                                                                  |
| Session scope | `ShoppingClientFacadeLocalEJB.getShoppingCart()` creates the cart lazily                                                    | `SignOffHTMLAction` invalidates the HTTP session, so a fresh cart follows                                                             |
| Security      | `ejb-jar.xml` `<unchecked/>` on all cart methods. `cart.do` is not in `signon-config.xml`                                   | Anonymous shoppers can use the cart. Checkout (`enter_order_information.screen`) is protected                                         |
| Cart screen   | `docroot/cart.jsp` L42-115, mapped by `mappings.xml` `cart.do` → `cart.screen`                                              | The empty branch tests `cart.count == 0`. The quantity input has `maxlength=10`. Check Out links to `enter_order_information.screen`  |

### Unreachable code (recorded, not specified)

- `addItem(String itemID, int qty)` (L115-117) is not on `ShoppingCartLocal` and has no container-transaction entry, so no client can reach it. It would accept any quantity without validation. Pass B recorded it as CART-RULE-0011 (low, disputed). No requirement is written for it. Drop it once a human confirms.
- `ShoppingCartModel.getTotalCost()` duplicates the subtotal formula and has no caller in the tree (CART-RULE-0010, low, disputed). The formula agrees with `getSubTotal`, so the spec states it once.
- `ShoppingCartLocalHome` contains a commented-out `create(HashMap startingCart)`.

## Mapping to the rebuild stack

- **Cart state.** Session-scoped and server-held, keyed by a session identifier. The legacy cart is in-memory only. The recommended default is a Drizzle table `cart_lines(session_id, item_id, quantity, added_at)` in a new `db/` schema file, with a migration generated into `drizzle/`. It has a unique constraint on `(session_id, item_id)` to enforce one line per item. `added_at` gives the display order (OQ-6). A sign-out route deletes the session's lines. This persists something the legacy system did not. That is an accepted deviation: an in-process map would not survive a Nitro restart or multiple instances. Record it in ARCHITECTURE.md `## Key Decisions` when adopted.
- **Routes (Nitro/H3, file-based).** Suggested shapes:
  - `routes/api/cart/index.get.ts`: lines, count and subtotal
  - `routes/api/cart/items.post.ts`: add `{ itemId }`
  - `routes/api/cart/items/[itemId].delete.ts`: remove
  - `routes/api/cart/index.patch.ts`: batch update `{ quantities: Record<itemId, string | number> }`
- **Catalog resolution.** At read time, resolve each line through the catalog-browsing service with the cart locale. Do not copy price into the cart row.
- **Money.** Compute in integer minor units, or with a decimal type, rather than a JS `number`. The rounding rule is OQ-2.
- **Page.** `src/pages/cart.tsx` (vite-plugin-pages), with Tailwind and shadcn primitives. Check Out routes to the checkout order-information page, which enforces sign-on.

## Disputed and low-confidence points (need a human decision)

- **OQ-1 Re-add resets quantity to 1** (SHOPPING_CART-REQ-0001 / CART-RULE-0001, medium). The spec keeps the legacy behaviour. Most shoppers would expect an increment. Decide before building.
- **OQ-2 Money arithmetic** (CART-RULE-0005, low, disputed). The subtotal is summed in binary floating point with no rounding. Discovery finding F2 says the order total uses different arithmetic. Decide on one money type, scale and rounding mode for both cart subtotal and order total.
- **OQ-3 Unresolvable items** (SHOPPING_CART-BR-0004, low; CART-RULE-0006). An id the catalog cannot return is dropped from the listing and the subtotal. It stays in storage and in the count. The empty-cart check uses the count, so a cart holding only unresolvable items shows an empty table with a total of 0. The spec records the legacy behaviour. Decide whether to purge such lines, show them as unavailable, or block checkout.
- **OQ-4 Update of an absent item adds it.** `updateItemQuantity` does not check membership, so a positive quantity for an id not in the cart adds it. The spec records this. The item id is also not validated against the catalog on add or update.
- **OQ-5 No quantity upper bound.** The only limit is the 10-character input `maxlength`, which the server does not enforce. Values above 32-bit range fail integer parsing and become 0, which removes the line. Decide whether a cap applies.
- **OQ-6 Line order.** A `HashMap` gives undefined, unstable order. The rebuild should choose insertion order unless told otherwise.
- **OQ-7 Price is not locked.** Prices are re-read on every request, so a catalog price change between viewing the cart and checkout changes the subtotal. Decide whether to lock the price at add time.

## Non-goals

- Persisting a cart across sessions or devices (the legacy system never did).
- Discounts, tax and shipping in the cart subtotal.
- The locale-switch rules themselves (owned by `localization`), and order placement (owned by `checkout`).
