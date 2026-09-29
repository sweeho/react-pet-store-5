# SWHR-T-0084 summary

Added the My List panel (under the Pets menu) and the pet-tips banner (home and cart), both driven by `useAccount()` and absent for an anonymous visitor or when the preference is off.

- My List fetches the favourite category through the existing catalog route with `start=0&count=10` (the route has no count cap, so it is unchanged) and links each product to `/product/<id>`.
- The banner matches the favourite category case-insensitively across dogs/cats/reptiles/birds/fish and falls back to dogs. Copy is in `src/i18n/screens/pet-tips.ts` (en_US, ja_JP, zh_CN); layout follows `mockup-home-with-my-list-panel-and-pet-tips-ban.html` (read from the worktree).

## Files

- `src/components/account/MyListPanel.tsx`, `PetTipsBanner.tsx` and their tests (new); `src/i18n/screens/pet-tips.ts` (new)
- `src/components/layout/PetsMenu.tsx`, `src/pages/index.tsx`, `src/pages/cart.tsx` and tests for home and cart
- `src/pages/category/[categoryId].test.tsx`: its fetch stub now answers `/api/account` with 401, because the Pets menu now calls it and the test's sequential mock served that call the 503.

## AC coverage

AC-1 SWHR-C-0226 (a UI test with a mocked 12-product Fish response, as PLAN step 5 directs; no Playwright spec was added), AC-2 0227, AC-3 0228, AC-4 0229, AC-5 anonymous tests in the panel, banner, home and cart tests.

## Verification

`bun run verify` — pass (144 files, 705 tests). `bun run test:e2e` not run: Chromium is not installed in this container.
