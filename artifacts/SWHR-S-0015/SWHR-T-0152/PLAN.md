# PLAN — SWHR-T-0152: Screens (task group 6)

Change: `swhr-i-0012-supplier-inventory`. Read its `design.md` §"Sprint planning — SWHR-S-0015" first. Requirements: **Supplier home screen**, **Inventory update screen**, **Inventory unavailable state**, **Inventory update confirmation screen**.

## Design reference

Build what these show, with the SD-7 corrections (spec labels "Item Id" and "Existing Quantity", one Submit below the table, the "Back Ordered" explanation, "updated successfully" wording). Index: `artifacts/SWHR-S-0015/design/MANIFEST.md`.

- Home: `artifacts/SWHR-S-0015/design/mockup-supplier-home.html`, `wireframe-supplier-home.html`
- Inventory: `artifacts/SWHR-S-0015/design/mockup-supplier-inventory.html`, `wireframe-supplier-inventory.html`
- No items: `artifacts/SWHR-S-0015/design/mockup-supplier-inventory-no-items-in-inventory.html`, `wireframe-supplier-inventory-no-items-in-inventory.html`
- Confirmation: `artifacts/SWHR-S-0015/design/mockup-inventory-update-confirmation.html`, `wireframe-inventory-update-confirmation.html`

## Objective

Replace the "Coming soon" supplier placeholder with the home page, and add the inventory page with its no-items state and the update confirmation.

## Steps

1. Read P6, SD-3, SD-6 and SD-7, and open the mockups above. Copy page shape from `src/pages/supplier/index.tsx` (session gate) and `src/pages/admin/console.tsx` (sign-off call); table markup from `src/pages/admin/orders.tsx`; states from `src/components/state`.
2. Write page tests first (Vitest `client` project, `fetch` stubbed): `index.test.tsx` SWHR-C-0404 (rewrite the placeholder assertions; keep the signed-off redirect and not-authorised cases); `inventory.test.tsx` SWHR-C-0407, SWHR-C-0409, SWHR-C-0410, plus a submit that posts every row with its `update` flag, navigates to `/supplier/updated` on 200 and shows an error on 400/500; `updated.test.tsx` SWHR-C-0411.
3. Build the three pages per P6. Every page keeps the signed-off redirect and the not-authorised state. Display Inventory links `/supplier/inventory`; Logout posts the sign-off and follows its redirect.
4. Write `e2e/supplier-inventory.spec.ts`: sign in at `/supplier/signin` as the seeded `supplier` user, then SWHR-C-0405 (home → inventory), SWHR-C-0408 (set EST-1 and EST-2 to 10 first, then EST-1 50 ticked and EST-2 60 unticked → confirmation, EST-2 still 10), SWHR-C-0412 (confirmation → inventory shows EST-1 at 50) and SWHR-C-0406 (logout → signed-out page with re-entry). Other specs order EST-1 and EST-6 in parallel, so never set a stock level below 10. Run it before committing.

## File/module ownership

- `src/pages/supplier/index.tsx`, `src/pages/supplier/index.test.tsx`
- new `src/pages/supplier/inventory.tsx`, `inventory.test.tsx`, `updated.tsx`, `updated.test.tsx`
- new `e2e/supplier-inventory.spec.ts`
- new `src/components/supplier/**` only if a component is shared by two pages

Do not touch the supplier sign-in, login-error or signed-out pages, or anything under `routes/` or `lib/`.

## Definition of Done

AC-1 to AC-10 of the ticket.
