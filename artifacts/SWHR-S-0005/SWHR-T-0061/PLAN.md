# SWHR-T-0061 — Catalog seed data and listing-cache decision

Change `swhr-i-0006-catalog-browsing-and-search`, tasks.md group 5. Read `openspec/changes/swhr-i-0006-catalog-browsing-and-search/design.md` first (SD1, SD8, P4, P6, Q9, Q10). Depends on SWHR-T-0057 (attribute columns, FK enforcement).

## Objective

A fresh store is filled with the legacy pet catalog in three locales, an already populated store is left alone, and the two cache scenarios hold without a cache.

## Design reference

Seed data only. Screens in `artifacts/SWHR-S-0005/design/` show the names and prices the seed must produce (e.g. `mockup-item-detail.html`, `mockup-category-product-listing-first-page.html`).

## Steps

1. Rewrite `db/seed/catalog.ts` with the legacy ids. The legacy Populate XML is not in this repository; use the public Java Pet Store / JPetStore dataset:
   - Categories BIRDS, CATS, DOGS, FISH, REPTILES (keep the existing localized names/descriptions).
   - Products: FI-SW-01 Angelfish, FI-SW-02 Tiger Shark, FI-FW-01 Koi, FI-FW-02 Goldfish (FISH); K9-BD-01 Bulldog, K9-PO-02 Poodle, K9-DL-01 Dalmation, K9-RT-01 Golden Retriever, K9-RT-02 Labrador Retriever, K9-CW-01 Chihuahua (DOGS); RP-SN-01 Rattlesnake, RP-LI-02 Iguana (REPTILES); FL-DSH-01 Manx, FL-DLH-02 Persian (CATS); AV-CB-01 Amazon Parrot, AV-SB-02 Finch (BIRDS).
   - Items EST-1 … EST-28 with `attr1` (e.g. EST-6 "Male Adult", EST-7 "Female Puppy") and `name = attr1 + " " + product name`. en_US prices in cents from the dataset; EST-6 is list 1850 / unit 1200, EST-7 list 1850 / unit 1200.
   - ja_JP and zh_CN details for every category, product and item, except: EST-15 has no ja_JP details (Q10); K9-DL-01 has no ja_JP product details while its item EST-9 keeps ja_JP item details (localization SWHR-R-0014.03); K9-PO-02 and its items have en_US only (SWHR-R-0014.02). EST-6 ja_JP list price stays 2000 (localization SWHR-R-0015.01).
   - Every image reference (category, product, item) is its category's picture name: `birds.svg`, `cats.svg`, `dogs.svg`, `fish.svg`, `reptiles.svg` (SD10). SWHR-T-0060 ships the files.
   - Trim every string (Q9).
2. Keep the existing "seed only when `category` is empty" guard in `db/client.ts` untouched; add `lib/catalog/seed.test.ts` proving both seed scenarios (empty → loaded; populated → a changed row is not overwritten).
3. Migrate every test and E2E spec that names `BULLDOG`, `POODLE`, `DALMATIAN` or relies on the old prices to the new ids and prices. Known files: `e2e/product-locale.spec.ts`, `e2e/smoke.spec.ts`, `e2e/sign-on.spec.ts`, `src/pages/product/[productId].test.tsx`, `src/pages/cart.test.tsx`, `routes/api/signoff.test.ts`, `routes/api/catalog/products/[productId].test.ts`, `routes/api/cart/items.test.ts`, `routes/api/cart/index.test.ts`, `lib/catalog/cart.test.ts`, `lib/cart/lines.test.ts`, `lib/catalog/queries.test.ts`. EST-6 and EST-7 now share a list price; make any assertion that matched on price alone unambiguous.
4. Cache scenarios (P4, no cache): in `lib/catalog/seed.test.ts` or `routes/api/catalog/products/[productId].test.ts`, add a product to DOGS and show the next read returns it; read DOGS then CATS and show CATS returns CATS' products. Use the existing `getProduct`/`listProductItems` or a direct query; SWHR-T-0058 adds the listing functions later and does not need to revisit these.

## File/module ownership

- `db/seed/catalog.ts`
- `lib/catalog/seed.test.ts` — new
- the test/spec files listed in step 3 — id and price migration only

## Definition of Done

AC-1 … AC-4 on the ticket, each proven by a named test; the E2E suite is green against the new seed.
