# SWHR-T-0098 summary

Four ungated cart routes now answer a `CartView` (P3, P7): `GET`/`PATCH /api/cart`, `POST /api/cart/items` (400 without `itemId`, 404 for an unknown item), `DELETE /api/cart/items/:itemId` (200 even if absent). `PATCH` answers 400 when `quantities` is not a plain object. Sign-on gate never called.

Files: `routes/api/cart/{index.get,items.post,index.patch}.ts`, `routes/api/cart/items/[itemId].delete.ts`, their tests (`index.test.ts`, `items.test.ts`, `index.patch.test.ts`, `items/[itemId].test.ts`), `src/pages/cart.tsx` (reads flat `CartLine` fields, `view.count`, `view.locale`) and `src/pages/cart.test.tsx` (fixture moved to the `CartView` shape; not in PLAN's ownership list but required by the shape change).

AC coverage: AC-1 by `[SWHR-C-0240]` in `items.test.ts` (anonymous POST adds EST-6, no error or redirect).

Verification: `bun run verify` passed (152 files, 752 tests); e2e result in the work log. No design consulted beyond the unchanged page layout.
