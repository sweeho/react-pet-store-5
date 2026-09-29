# Fix note — SWHR-T-0023

Change: `swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00` (design.md §D1).

## Root cause

`src/components/layout/GlobalNav.tsx` built its desktop `SECONDARY_AREAS` row
(Search/Checkout) and mobile drawer `SECONDARY_NAV_AREAS` list
(Search/Cart/Checkout/Account/Administration/Supplier) from `PRIMARY_AREAS` and rendered
`{area.label}` — a raw, hardcoded English string baked into
`src/constants/navigation.ts` — instead of going through `useScreen("shell")` like every
other piece of shell chrome (header search button, Account/Cart in `SiteHeader.tsx`,
`t.administration`/`t.supplier`, etc.). The session locale never touched these six links,
so they stayed English in ja_JP/zh_CN.

Re-verified on the sprint base (design.md § Context): the category half of the original
report was already fixed by SWHR-S-0005 — `PetsMenu.tsx`, the mobile drawer's "Pets"
section and the category heading all read from the locale-scoped
`/api/catalog/categories` response, not `PET_CATEGORIES[].label`. That half needed
regression coverage only, no code change.

## Minimal fix

1. `src/i18n/screens/shell.ts` — add a `checkout` key in en_US/ja_JP/zh_CN, reusing the
   `checkout` screen's existing title wording (Checkout / 購入手続き / 结账). Every
   existing key is unchanged.
2. `src/components/layout/GlobalNav.tsx` — add an `AREA_LABEL_SHELL_KEYS` id→shell-key
   map (SEARCH→`searchButton`, CART→`cart`, CHECKOUT→`checkout`, ACCOUNT→`account`,
   ADMIN→`administration`, SUPPLIER→`supplier`) and render `t[AREA_LABEL_SHELL_KEYS[area.id]]`
   in place of `area.label`, in both the desktop row and the mobile drawer's storefront
   section.
3. `src/constants/navigation.ts` — drop the now-dead `label` field from `PrimaryArea` and
   `PetCategory`, and `sampleBreeds` from `PetCategory` (nothing reads either — checked
   every import site). `PRIMARY_AREAS`/`PET_CATEGORIES` entries now carry only `id`/`href`,
   matching the header comment's "single source of truth for the app's navigable areas".

No other file changed behavior. `SiteLayout.test.tsx` and `src/pages/index.test.tsx`
already asserted only on `.href`, so they needed no change for the dropped fields.

## Files touched

- `src/i18n/screens/shell.ts` — new `checkout` key, 3 locales.
- `src/components/layout/GlobalNav.tsx` — id→shell-key label map.
- `src/constants/navigation.ts` — dropped `label`/`sampleBreeds`.
- `src/components/layout/GlobalNav.test.tsx` — new, regression test (SWHR-C-0437, -0439).
- `e2e/shell.spec.ts` — regression tests (SWHR-C-0431, -0436, -0438, -0440).
- `e2e/catalog-browsing.spec.ts` — regression test (SWHR-C-0432).
