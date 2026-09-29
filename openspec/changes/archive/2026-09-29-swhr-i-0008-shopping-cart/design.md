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

## Sprint planning — SWHR-S-0010

This section was added at sprint planning (SWHR-T-0093), on sprint base `f195d44`. The extracted sections above are unchanged. Where they give options, the decisions below choose one, grounded in the code that already exists.

### Codebase findings

- **Data model already exists (tasks 1.1, 1.2).** `db/schema.ts` `cartLines` (migration `drizzle/0004_lonely_pete_wisdom.sql`): `id` PK, `sessionId` → `sessions.id`, `itemId` → `item.id`, integer `quantity` default 1, `addedAt` timestamp, unique index `(sessionId, itemId)`. Sign-on (swhr-i-0005, P9) built it in this change's shape. No schema change and no new migration are needed.
- **Money is already decided (task 1.4 / OQ-2).** `lib/locale/money.ts` stores prices as integer minor units per locale (cents for USD/CNY, whole yen for JPY), and `formatPrice(minor, locale)` formats them in the SPA. Catalog rows carry `listPrice` and `unitCost` in minor units.
- **Existing service** `lib/cart/lines.ts`: `addCartItem` (increments), `listCartLines`, `deleteCartLinesForSession`, and `getCartWithDetails`, which resolves each line through `lib/catalog/cart.ts` `getCartItemDetails` → `getItem(itemId, cartLocale)` and drops unresolved lines.
- **Session scope and sign-out already work (tasks 2.1, 2.10).** `lib/auth/session.ts` `endSessionRow` deletes a session's cart lines on sign-out and on idle expiry, and the next request gets a fresh anonymous session (`lib/auth/session.test.ts` "endAuthSession"). Signing in updates the same session row, so an anonymous cart survives sign-in.
- **Cart locale.** `lib/locale/session.ts` `getCartLocale(event)` is the cart's own locale. It is set together with the session locale and defaults to en_US.
- **Existing routes:** `routes/api/cart/index.get.ts` and `routes/api/cart/items.post.ts` return `{ lines: CartLineView[] }` (item nested). They are never gated (SWHR-R-0070). No DELETE or PATCH route exists.
- **SPA:** `src/pages/cart.tsx` lists lines as "Quantity: n" text with the list price and uses the shared `EmptyState` ("Your cart is empty"). `AddToCartButton` (`src/components/catalog/`) already sits on the product, item and search pages (task 4.5 is already done). `src/components/layout/SiteHeader.tsx` renders a Cart link with no count.
- **Checkout** is a placeholder (`src/pages/checkout.tsx`). `/checkout` is protected in `configs/signon-config.json`, so Check Out → `/checkout` asks an anonymous shopper to sign in first. No order placement exists yet (swhr-i-0009).
- **Existing tests that assume increment or the old page:**
  - `lib/cart/lines.test.ts` ("increments" case)
  - `routes/api/cart/items.test.ts` ("increments the quantity…")
  - `e2e/sign-on.spec.ts` SWHR-C-0135: adds one item 3 times and asserts "数量: 3"
  - `e2e/catalog-browsing.spec.ts` SWHR-C-0184 and its neighbour: assert "Quantity: 1" text
  - `src/pages/cart.test.tsx`
- **Seed:** EST-6 has list price 1850 and supplier `unitCost` 1200 (en_US), and EST-1 has list price 1650.

### Planning decisions

- **P1 — Re-add follows the spec: reset to 1.** The spec (SWHR-R-0135.02) and the approved case SWHR-C-0242 are the QA oracle for this sprint. This contradicts PRD decided behaviour 3 (see Spec discrepancies SD-1), which is escalated rather than resolved here. If the requirement is corrected before SWHR-T-0097 starts, SWHR-T-0097 implements increment instead and its criterion changes with the scenario. The line keeps its original `addedAt` position.
- **P2 — "Unit cost" in the spec is the catalog LIST PRICE.** `CartLine.unitCost` is `ItemView.listPrice`, never `ItemView.unitCost`, which is the supplier cost (PRD decided behaviour 4). All money in the cart contract is integer minor units in the cart locale: 18.50 is `1850`, and the line total is `quantity * unitCost`, an integer.
- **P3 — One view contract.** New `lib/cart/types.ts`:
  - `CartLine { itemId, productId, categoryId, productName, name, attribute: string | null, quantity, unitCost, lineTotal }`, where `attribute` is the first attribute (`attributes[0]`), the legacy `attr1`.
  - `CartView { lines: CartLine[]; count: number; subtotal: number; locale: LocaleId }`.
  - `count` is the number of stored lines, including unresolvable ones. `subtotal` covers resolved lines only.
  - Every cart route returns a `CartView`, and the SPA formats money with the view's `locale`.
- **P4 — Service surface** (`lib/cart/lines.ts`):
  - `getCart(event, sessionId): Promise<CartView>`
  - `addCartItem(sessionId, itemId): boolean`, returning `false` when `itemId` is not in the `item` table
  - `removeCartItem(sessionId, itemId): void`
  - `updateCartQuantities(sessionId, quantities: Record<string, unknown>): void`
  - `parseQuantity(value: unknown): number`
  - `countCartLines(sessionId): number`
  - `emptyCart(sessionId, tx?): void`, where `tx` defaults to `db` so checkout can pass its transaction
  - `deleteCartLinesForSession` stays for `lib/auth/session.ts`.
  - Lines are ordered by `addedAt`, then `id` (OQ-6).
- **P5 — Quantity parsing** (SWHR-R-0138, OQ-5):
  - A string matching `^-?\d+$` becomes its integer value; so does a JS integer.
  - Anything else becomes 0. That covers letters, decimals, blanks, whitespace-padded input, and values outside the 32-bit signed range (legacy `Integer.parseInt` parity).
  - There is no further cap.
- **P6 — Unknown item ids.** `cartLines.itemId` has a foreign key to `item.id`.
  - `POST /api/cart/items` with an id not in `item` answers 404 and changes nothing.
  - A batch update silently ignores entries whose id is not in `item` (OQ-4 keeps "update adds an absent item" only for real catalog items).
  - "Cannot be resolved" (SWHR-R-0142) therefore means the item has no details in the cart locale. Tests build that case by inserting an `item` row with no `itemDetails` in the cart locale.
- **P7 — Routes** (all ungated, all answer a `CartView`):
  - `GET /api/cart`
  - `POST /api/cart/items {itemId}`: 400 without `itemId`, 404 for an unknown item
  - `DELETE /api/cart/items/:itemId`: 200 even if absent
  - `PATCH /api/cart {quantities}`: 400 when `quantities` is not an object
  - The response shape changes from `{ lines: CartLineView[] }`, so SWHR-T-0098 adjusts `src/pages/cart.tsx`'s field reads just enough to keep rendering until SWHR-T-0099 rebuilds the page.
- **P8 — Cart page and header count** (mockups in `artifacts/SWHR-S-0010/design/`):
  - The page has a table with columns Item, Remove, Quantity, Unit price.
  - Each item cell shows `attribute` + `productName` linked to `/item/:itemId`, with "EST-6 · Dogs" underneath.
  - The quantity is an `<input maxLength={10}>`.
  - Update Cart sends every quantity in one PATCH. Below it sit the hint text, the Subtotal, and Check Out linking to `/checkout`.
  - The empty state is exactly "Your Shopping Cart is Empty." with a "Back to home" link, and nothing else. It is decided by `count === 0`, per legacy parity.
  - The header Cart link shows `count` from `GET /api/cart` through a small `src/hooks/useCartCount.ts`. It refreshes on a `cart:changed` window event that `AddToCartButton` and the cart page dispatch after a successful change.
  - Copy is localized in `src/i18n/screens/cart.ts`.
- **P9 — Emptying after an order** (SWHR-R-0144). `emptyCart` is the delivered surface. Checkout (swhr-i-0009) calls it inside its order transaction. This sprint verifies the scenario at service level (SWHR-C-0256), because no order placement exists yet.
- **P10 — Sequencing.** The five TASKs run strictly in order, SWHR-T-0096 → 0097 → 0098 → 0099 → 0100. Each one changes behaviour that the next one's files, or the shared e2e specs, assert, and CI runs E2E on every ticket branch. Each TASK updates the pre-existing assertions its own change breaks (see Codebase findings). SWHR-T-0100 adds the scenario suites.

### Phases

1. **Data model** (SWHR-T-0096): the contract types in P3, and confirmation that the existing schema satisfies tasks 1.1, 1.2 and 1.4. No migration.
2. **Cart service** (SWHR-T-0097): P1, P2, P4, P5, P6, P9, with unit tests in `lib/cart/lines.test.ts`.
3. **API routes** (SWHR-T-0098): P7, with route tests beside each handler.
4. **Cart page** (SWHR-T-0099): P8, with the UI tests in `src/pages/cart.test.tsx`.
5. **Test harness** (SWHR-T-0100): scenario-level route integration tests in `routes/api/cart/scenarios.test.ts`, run in the Vitest `server` project, whose in-memory database and seeded catalog already cover this. Also a new `e2e/cart.spec.ts` journey through add → update → remove → Check Out, running on Playwright's fresh `SQLITE_PATH` database. Every test title carries its approved case key (SWHR-C-0232 to SWHR-C-0256).
6. **CI**: no workflow change. `.github/workflows/ci.yml` already runs lint, typecheck, unit and integration tests, build, and E2E on pushes and pull requests for `vortex/**`, and uploads both JUnit reports. The new `routes/api/cart/*.test.ts` and `e2e/cart.spec.ts` fall inside the existing `testEvidence.testGlobs`.

### Spec discrepancies

- **SD-1 — Re-add rule.** SWHR-R-0135 ("MUST NOT increment") and approved case SWHR-C-0242 contradict PRD decided behaviour 3 (increment), and PRD constraint 4 says the decided behaviour wins and the spec is corrected. The PRD's open question 2 already lists this correction as owed. The existing code and three existing tests increment. The plan builds to the spec (P1) pending a human correction of the requirement, its scenario, its test case and the criterion on SWHR-T-0097.
- **SD-2 — Empty-cart copy.** The spec requires "Your Shopping Cart is Empty." The code shows "Your cart is empty" plus a description. The code changes (SWHR-T-0099); the spec stands.
- **SD-3 — Unknown item ids.** The spec's EST-99 is an id "the catalog cannot return", and OQ-4 lets an update add any id. Here, `cartLines.itemId` is a foreign key to `item.id`, so an id outside the catalog cannot be stored. Resolved by P6. The scenario is satisfied with an item that has no details in the cart locale.
- **SD-4 — Header count.** The idea and all three mockups show a Cart count in the header, but no requirement or scenario covers it, and `tasks.md` has no box for it. It is built under SWHR-T-0099 (P8), with no spec change.
- **SD-5 — Order placement.** SWHR-R-0144.01 says "the shopper places an order", but no order placement exists yet. It is verified at service level (P9) until checkout lands.
- **SD-6 — Already built.** Tasks 1.1, 1.2, 1.4, 2.1, 2.10 and 4.5 describe work that is already in the repository (Codebase findings). Their owners confirm it and tick them; no rebuild.
- **SD-7 — Money literals.** The scenarios state money as decimals (18.50). The system carries integer minor units (P2). A test asserts 1850 at the service and API level, and "$18.50" on screen.
