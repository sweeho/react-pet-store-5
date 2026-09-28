# PLAN — SWHR-T-0005 Landing page at '/' linking to every primary area

Change: `swhr-i-0002-bootstrap-landing-page-and-s` · requirement **Landing page** (SWHR-R-0001) · tasks.md group 2 (2.1, 2.2). Read `openspec/changes/swhr-i-0002-bootstrap-landing-page-and-s/design.md` first.

## Objective

Replace the Vortex template hero with the Pet Store home page, backed by the single primary-area list every later page renders from.

## Steps

1. Create `src/constants/navigation.ts` (design.md §Decisions → Primary-area list, route contract): `PET_CATEGORIES` (BIRDS, CATS, DOGS, FISH, REPTILES; label, href `/category/<id>`, sample breed names from the mockup) and `PRIMARY_AREAS` (`{ id, label, href }`) for shop-by-pet, search, cart, checkout, account, signin, admin, supplier. Export the types.
2. Placeholder pages (design.md §Decisions → Placeholder pages), each a heading plus one line of copy for now: `src/pages/category/[categoryId].tsx`, `search.tsx`, `cart.tsx`, `checkout.tsx`, `account.tsx`, `signin.tsx`, `admin/index.tsx`, `supplier/index.tsx`. SWHR-T-0007 later swaps their body to `EmptyState`.
3. Rewrite `src/pages/index.tsx` to the landing mockup's CONTENT only: hero ("Find your next pet", h1), five category cards linking to `PET_CATEGORIES`, "Your account" card (Account / Sign in), "Store staff" card (Administration, Supplier), plus links to search, cart and checkout so every `PRIMARY_AREAS` href is reachable from the page body. No header/footer/nav here — SWHR-T-0006 owns the shell. Use `<Link>` from react-router and token classes only.
4. Delete `src/pages/about.tsx` and `src/pages/users/` (template demos). Keep `routes/api/users/*` — the smoke test uses them.
5. Tests: rewrite `src/pages/index.test.tsx` (MemoryRouter at `/`; SWHR-C-0003). Rewrite `e2e/home.spec.ts` to the landing page (SWHR-C-0002) and drop template assertions, including the no-scrollbar check.

## File/module ownership

`src/constants/navigation.ts` (new), `src/pages/index.tsx`, `src/pages/index.test.tsx`, `src/pages/category/[categoryId].tsx`, `src/pages/search.tsx`, `src/pages/cart.tsx`, `src/pages/checkout.tsx`, `src/pages/account.tsx`, `src/pages/signin.tsx`, `src/pages/admin/index.tsx`, `src/pages/supplier/index.tsx` (all new), `src/pages/about.tsx` and `src/pages/users/*` (delete), `e2e/home.spec.ts`.

## Design reference

`artifacts/SWHR-S-0001/design/mockup-landing-page.html`, `wireframe-landing-page.html`; index `MANIFEST.md`.

## Definition of Done

AC-1 … AC-6 on the ticket.
