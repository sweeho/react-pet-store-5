# PLAN — SWHR-T-0023: Global navigation area labels stay English in ja_JP and zh_CN

Change: `swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00`. Read `openspec/changes/swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00/design.md` first.

## Objective

Every Global navigation area label renders in the session locale, and regression scenarios pin the non-English area labels, the ja_JP Pets menu and the ja_JP category heading. The category-label half of the original report was already fixed by SWHR-S-0005 and needs tests only (design.md §Context).

## Steps

1. Add the `checkout` key to `src/i18n/screens/shell.ts` in all three locales (design.md §D1).
2. In `GlobalNav.tsx`, render each `SECONDARY_AREAS`/`SECONDARY_NAV_AREAS` entry through the id→shell-key map from design.md §D1 instead of `area.label`.
3. Remove `label` from `PrimaryArea`, and `label`/`sampleBreeds` from `PetCategory`, in `src/constants/navigation.ts`. Fix every consumer the compiler flags (design.md §Risks).
4. Unit: extend `SiteLayout.test.tsx` (or a GlobalNav test beside it) so the menu renders the ja_JP and zh_CN labels from AC-1/AC-2 and the en_US labels from AC-3.
5. E2E: add ja_JP coverage for AC-1, AC-4 and AC-5 (in `e2e/shell.spec.ts` and `e2e/catalog-browsing.spec.ts`, switching locale the way `e2e/product-locale.spec.ts` does). Leave the existing en_US `"Birds"` assertion as it is.

## File/module ownership

- `src/constants/navigation.ts`
- `src/components/layout/GlobalNav.tsx`
- `src/i18n/screens/shell.ts`
- `src/components/layout/SiteLayout.test.tsx` (plus an optional new `src/components/layout/GlobalNav.test.tsx`)
- `src/pages/index.test.tsx` (only if step 3 breaks it)
- `e2e/shell.spec.ts`, `e2e/catalog-browsing.spec.ts`

## Definition of Done

AC-1 through AC-6 on the ticket hold. The app builds, and its unit and E2E suites are green.
