# SWHR-T-0062 — Pin the settled open decisions

Change `swhr-i-0006-catalog-browsing-and-search`, tasks.md group 6. Read `openspec/changes/swhr-i-0006-catalog-browsing-and-search/design.md` first, section "Open questions settled for this sprint". Depends on SWHR-T-0060.

## Objective

Each open question settled at planning (Q1, Q3, Q4, Q7, Q8) is enforced by a test whose title cites the question code, so a later change that reverses one fails loudly instead of drifting.

## Design reference

`artifacts/SWHR-S-0005/design/mockup-product-item-listing-middle-page.html` (list price per row) and `mockup-search-results-matches.html` (unit cost per row) illustrate Q7.

## Steps

1. `lib/catalog/decisions.test.ts` (server project), one `describe` per question:
   - Q1: "FISH" and "fish" return the same en_US items; a ja_JP search for FISH's ja_JP category name returns no item matched only by category.
   - Q3: fixture product with 5 items, page start 4 size 2 → `previousStart` 3.
   - Q4: `DEFAULT_PAGE_SIZE` is 2; the categories route/list returns all 5 en_US categories.
   - Q7: through the product and search routes, EST-6's en_US row carries list price 1850 on the product listing and unit cost 1200 on search, formatted by `formatPrice` as $18.50 and $12.00.
   - Q8: two identical `listItems`/`searchItems` calls return identical id sequences in ascending item-id order.
2. If a test exposes behaviour that contradicts the decision, fix the code in the owning module (`lib/catalog/*`), not the test, and say so in the work log.

## File/module ownership

- `lib/catalog/decisions.test.ts` — new
- `lib/catalog/queries.ts`, `lib/catalog/paging.ts` — only if a decision test exposes a defect

## Definition of Done

AC-1 … AC-6 on the ticket.
