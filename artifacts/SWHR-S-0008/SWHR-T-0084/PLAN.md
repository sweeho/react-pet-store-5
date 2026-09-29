# SWHR-T-0084 — Personalisation: My List panel and pet-tips banner

Change `swhr-i-0007-customer-account-and-profile`, tasks.md group 5. Read `openspec/changes/swhr-i-0007-customer-account-and-profile/design.md` §Sprint planning first (P4, P10, SD7). Depends on SWHR-T-0083 (`useAccount`).

## Objective

A signed-on shopper with My List on sees up to 10 products of their favourite category under the Pets menu, each linking to its product page. With pet tips on, home and cart show the banner for their favourite category, or the dogs banner if the category has none. Off means absent; anonymous means absent.

## Design reference

- `artifacts/SWHR-S-0008/design/mockup-home-with-my-list-panel-and-pet-tips-ban.html` (+ `wireframe-home-with-my-list-panel-and-pet-tips-ban.html`)
- The My List panel also appears in `mockup-account-overview.html`, under the Pets menu.

## Steps

1. `src/components/account/MyListPanel.tsx` (new): reads `useAccount()`. When `profile.myListPreference` is on and a favourite category is set, it fetches the category's first 10 products through the existing catalog category route (`start=0`, `count=10`) and lists links to `/product/<id>`. If that route caps `count` below 10, raise the cap there.
2. `src/components/layout/PetsMenu.tsx`: render `MyListPanel` below the categories in the same column.
3. `src/components/account/PetTipsBanner.tsx` (new): case-insensitive match of the favourite category against dogs/cats/reptiles/birds/fish, else dogs. Copy comes from `src/i18n/screens/pet-tips.ts` (new, all three locales); the icon comes from `getCategoryIcon`. Renders only when `profile.bannerPreference` is on.
4. Place `PetTipsBanner` on `src/pages/index.tsx` and `src/pages/cart.tsx` only.
5. UI tests: one named test per AC, named with its approved `SWHR-C-*` id. The "first 10 of 12 Fish products" scenario uses a mocked fetch returning 12 products.

## File/module ownership

- `src/components/account/MyListPanel.tsx`, `src/components/account/MyListPanel.test.tsx` — new
- `src/components/account/PetTipsBanner.tsx`, `src/components/account/PetTipsBanner.test.tsx` — new
- `src/components/layout/PetsMenu.tsx`, `src/components/layout/PetsMenu.test.tsx`
- `src/pages/index.tsx`, `src/pages/index.test.tsx`, `src/pages/cart.tsx`, `src/pages/cart.test.tsx`
- `src/i18n/screens/pet-tips.ts` — new
- `routes/api/catalog/categories/[categoryId].get.ts` — only if its `count` cap is below 10

## Interface contracts

Consumes `useAccount()` (SWHR-T-0083) and the catalog category route's `{ items, paging }` shape (ARCHITECTURE.md Key Decision "One paging shape"). Exposes `MyListPanel` and `PetTipsBanner` as default exports with no required props.

## Definition of Done

AC-1 … AC-5 on the ticket, each proven by a named test.
