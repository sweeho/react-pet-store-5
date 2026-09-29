---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0005
ticket: SWHR-T-0060
branch: vortex/feat/SWHR-T-0060-storefront-catalog-screens-home-map-pets-f0992b97
upstream: [artifacts/SWHR-S-0005/SWHR-T-0060/PLAN.md]
downstream: [artifacts/SWHR-S-0005/SWHR-T-0062/PLAN.md]
---

# Summary — SWHR-T-0060: Storefront catalog screens

## What changed

Built the six catalog screens to the exported mockups, all reading `lib/catalog/queries.ts` through
SWHR-T-0059's routes:

- **Home** (`src/pages/index.tsx`): the "Choose a pet to start" picture map replaces the old category
  card grid — one region per category `GET /api/catalog/categories` returns, fixed grid position/icon
  per legacy category id (`HOME_MAP_REGIONS`), a category absent from the response simply isn't
  rendered. Hero and account/staff sections unchanged.
- **Pets panel** (`src/components/layout/PetsMenu.tsx`, new): the live category list, ordered as
  returned, rendered on the home, category, product, item and search pages. SWHR-R-0104 requires it on
  _every_ storefront page — item detail is included even though its own mockup omits the side panel;
  see `## Notes`. `GlobalNav`'s desktop category row is removed; its mobile drawer now shows the same
  live list under a "Pets" heading instead of the static `PET_CATEGORIES` labels.
- **Category** (`src/pages/category/[categoryId].tsx`): products ordered by name, two per page, each
  linking to `/product/<id>`; an unknown category or one with no products in this locale renders the
  same empty-state frame, never an error (SD6).
- **Product** (`src/pages/product/[productId].tsx`): item rows now link to `/item/<id>` (previously
  plain text), gained a breadcrumb and Previous/Next.
- **Item** (`src/pages/item/[itemId].tsx`, new): title, image, description, both List Price and Your
  Price (Q7 — the only screen that shows both), Add to Cart.
- **Search** (`src/pages/search.tsx`): real results — "Items matching any of: `<keywords>`", unit cost
  per row (Q7), the shared no-results frame for a blank field or no match.
- **Shared**: `AddToCartButton`, `PagingLinks`, `Breadcrumb`, `categoryIcons` under
  `src/components/catalog/`; `useCatalogCategories` hook (`src/hooks/`).
- `public/images/{birds,cats,dogs,fish,reptiles}.svg` (new): single-colour silhouettes matching the
  seed's `CATEGORY_IMAGE` references (SD10).
- `e2e/catalog-browsing.spec.ts` (new): the cross-page journeys and the real Add to Cart round trip.

## Files

See the two commits (`test(swhr-t-0060)... [red]` and its fix, `feat(swhr-t-0060)... [green]`) for the
full file list — all within this ticket's ownership (`src/pages/{index,search}.tsx`,
`src/pages/category/[categoryId].tsx`, `src/pages/product/[productId].tsx`,
`src/pages/item/[itemId].tsx` (new) and tests; `src/components/layout/{GlobalNav,PetsMenu}.tsx` (+
test); `src/components/catalog/**` (new); `src/hooks/useCatalogCategories.ts` (+ test),
`src/hooks/index.ts`; `src/i18n/screens/{home,category,product,search,shell,item}.ts`;
`public/images/*.svg`; `e2e/catalog-browsing.spec.ts`). `e2e/home.spec.ts` was also touched — its
"links to every pet category" assertion named the old grid's "Browse {label} →" link text, which the
picture map no longer produces; updated to match the new region text.

## AC coverage

All 14 acceptance criteria are proven: 9 by a genuine red→green unit test (SWHR-C-0173, -0182, -0183,
-0184, -0186, -0188, -0190, -0191, -0192 — see `tdd-test-result.md` for the case→test mapping), 5 by
`e2e/catalog-browsing.spec.ts` only (SWHR-C-0180, -0181, -0185, -0187, -0189 — cross-page navigation
journeys with no reasonable unit-level equivalent, or, for -0189, behavior unchanged by this ticket).
This container has no working Chromium (`bun run test:e2e`'s own preflight confirms it, pinned-version
mismatch), so the e2e spec couldn't be run here — but CI's `build-and-test` job does run it, in a real
browser, and its first run caught two genuine bugs this container's tooling gap let through: see
`## Notes`. Both are fixed and CI is green on the final commit.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
NODE_ENV=test bun --bun vitest run
 Test Files  126 passed (126)
      Tests  605 passed (605)

$ bun run build          # ✓
$ node scripts/check-doc-links.mjs   # ✓ 80 files checked
```

`bun run test:e2e`'s preflight reports Chromium genuinely not installed at the pinned path in this
container; per AGENTS.md this is the documented fallback, not retried. As a partial substitute before
pushing, started the dev server and confirmed every new route serves 200 with correct catalog data
(`/`, `/category/DOGS`, `/product/K9-BD-01`, `/item/EST-6`, `/search?keywords=bulldog`, plus the
underlying `/api/catalog/*` and `/images/*.svg` endpoints). CI's `build-and-test` job (real Chromium)
ran the full 49-spec E2E suite including `e2e/catalog-browsing.spec.ts` twice: the first run failed 3
specs, both real bugs (see `## Notes`); the second, after fixing them, is green —
https://github.com/sweeho/react-pet-store-5/actions/runs/36526239836. This ticket carries
platform-linked test cases, so `tdd-test-result.md` carries the recorded run ids rather than a
`TDD-RESULT:` marker.

## Notes

**Two real bugs, both only visible in a real browser, caught by CI's first E2E run.**

1. Home (`src/pages/index.tsx`) never actually rendered `<PetsMenu />` — I'd wired it into category/
   product/item/search but forgot Home itself, despite writing (at the time, incorrectly) that it was
   on all five pages. `SWHR-C-0180` and `SWHR-C-0185` both start their journey at `/` and hung the full
   30s test timeout (three attempts each) waiting for a "Pets" navigation landmark that wasn't there.
   Fixed by wrapping Home's content in the same layout every other catalog page uses; added a unit test
   asserting the Pets menu's presence on Home specifically, since no test had covered that before.
2. A pre-existing `e2e/sign-on.spec.ts` case (`SWHR-C-0106`, not owned by this ticket) asserted the old
   placeholder search heading `'Search results for "dog"'`, which the real search page never produces —
   updated to match the new structure, same class of fix as the one already made to `e2e/home.spec.ts`.

Neither was reachable from this container (no working Chromium) or from the unit suite (both are
real-browser/cross-page behaviors) — this is exactly why PLAN step 13 asks for the e2e spec in the
first place. See `tdd-test-result.md` for the full account, including the CI JUnit artifacts inspected
to diagnose them.

**PetsMenu is composed per-page, not rendered globally by `SiteLayout`.** `PLAN.md` step 2 says "rendered
by SiteLayout on storefront pages" — SiteLayout wraps _every_ route in this app (admin, supplier, cart,
checkout included; confirmed by reading `src/main.tsx`), and the item-detail mockup itself omits the
panel while every other catalog mockup includes it. Adding a route-matching conditional to SiteLayout
(a component with a strict "one banner/nav/main/contentinfo" contract and currently zero routing logic)
to reproduce that exact per-page pattern was more machinery, and more risk to an existing fixed
contract, than five pages each importing `<PetsMenu />` directly. Since SWHR-R-0104 explicitly requires
it on _every_ storefront page (not "every page this ticket's mockups show it on"), I built it into all
five catalog pages, including item detail — the spec requirement outranks the one mockup's specific
omission. `SiteLayout.tsx` itself is untouched; `SiteLayout.test.tsx` was updated only where GlobalNav's
own rendered output changed (see `tdd-test-result.md`'s note for the retagged `PagingLinks.test.tsx`,
similarly affected by needing `LocaleProvider`).

**Product/item breadcrumbs show the raw category id, not its localized name.** Resolving the localized
name would need another `/api/catalog/categories` fetch (`PetsMenu` already makes one, `GlobalNav`
another — a third per page felt like the wrong place to add more redundant fetching without a shared
cache). Filed no follow-up for this specifically; the category page's own breadcrumb is correct since it
already has the category's name in its own response.

**AsyncContent's error frame is generic, not catalog-specific.** The mockup's "This page could not be
loaded" / "The pet catalog could not be reached..." copy isn't reachable through `src/components/state/
AsyncContent.tsx`'s current API (it renders its own internal `<ErrorState onRetry={retry} />` with no
prop passthrough), and that component is outside this ticket's ownership. Category/product/item/search
all get `AsyncContent`'s default error text and retry button instead — same purpose, different copy.

**"Showing 1–2" paging summary text omitted** from `PagingLinks` (visible in the mockups, not tested by
any AC) — a reasonable simplification within scope/time; only Previous/Next themselves are required.

No new follow-up tickets: the whole-repo stub-sentinel scanner false-positive this ticket's green run
also hit is already covered by SWHR-T-0065 (filed during SWHR-T-0057).
