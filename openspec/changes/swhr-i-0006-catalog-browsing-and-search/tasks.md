## 1. Data model

- [ ] 1.1 Define the category and category_details Drizzle tables with keys, name length and one-details-row-per-locale constraint
- [ ] 1.2 Define the product and product_details Drizzle tables with the category foreign key
- [ ] 1.3 Define the item and item_details Drizzle tables with exact-decimal list price and unit cost and five optional attributes
- [ ] 1.4 Generate and commit the migration in drizzle/ and add schema constraint tests

## 2. Catalog queries

- [ ] 2.1 Implement the category listing query filtered by locale and ordered by name
- [ ] 2.2 Implement the product listing query for a category filtered by locale and ordered by name
- [ ] 2.3 Implement the item listing query for a product requiring item and product details in the locale, returning correct product and category identifiers
- [ ] 2.4 Implement single category, product and item lookups that return no result for a missing identifier or locale
- [ ] 2.5 Implement shared paging (start offset, page size, next-page flag, next and previous start, empty page for out-of-range start)
- [ ] 2.6 Implement search keyword parsing (whitespace split, de-duplication, blank query short-circuit)
- [ ] 2.7 Implement case-insensitive OR-of-substring search over product name, category identifier and item description
- [ ] 2.8 Add unit tests covering locale visibility, ordering, paging edges and search matching

## 3. Server routes

- [ ] 3.1 Add the read-only category list and category detail routes
- [ ] 3.2 Add the product list route for a category with paging parameters
- [ ] 3.3 Add the item list route for a product and the item detail route
- [ ] 3.4 Add the search route with keyword and paging parameters
- [ ] 3.5 Validate paging and locale input and map catalog store failures to an error response with no partial result
- [ ] 3.6 Add integration tests for every catalog route, including anonymous access and store failure

## 4. Storefront screens

- [ ] 4.1 Build the home page category picture map linking to the five category listings
- [ ] 4.2 Build the Pets category navigation menu shown on every storefront page
- [ ] 4.3 Build the category product listing page with Previous and Next links
- [ ] 4.4 Build the product item listing page with list price, Add to Cart and Previous and Next links
- [ ] 4.5 Build the item detail page with image, List Price, Your Price and Add to Cart
- [ ] 4.6 Build the search results page with the matching-keywords header, result rows, paging and the no-results message
- [ ] 4.7 Wire every Add to Cart control to the shopping-cart capability
- [ ] 4.8 Add UI tests for each screen and a Playwright spec for home to category to product to item navigation

## 5. Caching and seed data

- [ ] 5.1 Add optional listing caching keyed by full address and locale with a 5-minute expiry, or record the decision to omit it
- [ ] 5.2 Implement catalog seeding on first entry when catalog data is absent, pending the Q6 scope decision
- [ ] 5.3 Restrict the forced catalog reload to an authorised operator if it is kept

## 6. Open decisions

- [ ] 6.1 Record the decisions on search case handling and category-name matching (Q1)
- [ ] 6.2 Record the decisions on product listing price, previous-page offset, page sizes and result ordering (Q3, Q4, Q7, Q8)
