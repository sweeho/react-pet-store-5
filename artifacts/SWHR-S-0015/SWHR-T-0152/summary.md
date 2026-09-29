# SWHR-T-0152 summary

Replaced the supplier "Coming soon" placeholder with the home page (`/supplier`), and added the inventory update page (`/supplier/inventory`, with the no-items state for an empty list or a failed GET) and the confirmation (`/supplier/updated`). Submit posts every row with its Update flag; 200 navigates to the confirmation, anything else shows an inline error. Logout posts the supplier sign-off and follows its redirect. Shared session gate and logout live in `src/components/supplier/` (`useSupplierSession.ts`, `NotAuthorised.tsx`).

Design: built from the mockups under `artifacts/SWHR-S-0015/design/` with the SD-7 corrections (Item Id / Existing Quantity labels, one Submit, "Back Ordered" copy, "updated successfully" wording). The shell header, language bar and footer come from the app layout, not the pages.

Files: `src/pages/supplier/{index,inventory,updated}.tsx` and their tests, `src/components/supplier/*`, `e2e/supplier-inventory.spec.ts`.

AC coverage: SWHR-C-0404..0412 (see `tdd-test-result.md`).

Verification: `bun run verify` passed (1001 tests); `bun run test:e2e` passed (74 tests).
