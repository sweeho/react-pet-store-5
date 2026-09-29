# PLAN — SWHR-T-0100: Cart scenario tests

Change: `swhr-i-0008-shopping-cart` · Tasks group 5 · Requirements: Cart screen, One cart per shopper session, Batch quantity update, Non-numeric quantity treated as zero, Catalog resolution at read time (and every scenario via the approved cases)

## Design reference

Mockups and wireframes are exported byte-exact under `artifacts/SWHR-S-0010/design/` (index: `MANIFEST.md`):
`mockup-shopping-cart-with-items.html`, `mockup-shopping-cart-after-update-cart.html`, `mockup-shopping-cart-empty.html`, and the three matching `wireframe-*.html` files. The e2e journey follows the "with items" → "after Update Cart" mockups.

## Objective

Add the scenario-level test harness: one route-integration suite and one Playwright journey, each test titled with its approved case key (`openspec/changes/swhr-i-0008-shopping-cart/test-cases.md`).

## Steps

1. Read `openspec/changes/swhr-i-0008-shopping-cart/design.md` §Sprint planning: Phases (5 and 6), P2, P6 and SD-7, then `test-cases.md`.
2. `routes/api/cart/scenarios.test.ts` (Vitest `server` project): drive the real handlers across requests with a carried cookie. Cover:
   - add and re-add (5.1)
   - remove, including an absent item (5.2)
   - batch update with positive, zero, negative, "abc", "1.5" and absent-item quantities (5.3)
   - count and subtotal, including an unresolvable item and the empty cart (5.4)
   - a price change between add and read, by updating the `itemDetails` list price (5.5)
   - session isolation, and sign-out via `routes/api/signoff` followed by an empty cart (5.6)
3. Extend `lib/cart/lines.test.ts` and `src/pages/cart.test.tsx` only with any approved case not already titled there (5.4, 5.7). Do not restructure the existing tests.
4. New `e2e/cart.spec.ts` (5.8), anonymous and in en_US:
   - add EST-6 and EST-1, open `/cart`, and check the rows, 3.50 and the header count 2
   - set EST-6 to 5 and EST-1 to 0, then Update Cart: one row, quantity 5
   - Remove EST-6: the empty message appears
   - add again, then Check Out: the sign-in page is shown for `/checkout`
     Run the spec at least once before committing.
5. CI needs no change (Phase 6). Confirm the new files are picked up by the existing Vitest project and `testGlobs`.

## File/module ownership

- `routes/api/cart/scenarios.test.ts` (new)
- `e2e/cart.spec.ts` (new)
- `lib/cart/lines.test.ts`, `src/pages/cart.test.tsx` (added cases only)

Fixed interface: none new. Tests consume the P4 service, the P7 routes and the SWHR-T-0099 page as delivered.

## Definition of Done

AC-1 … AC-7. Every approved case SWHR-C-0232 … SWHR-C-0256 appears in some test title in the repository.
