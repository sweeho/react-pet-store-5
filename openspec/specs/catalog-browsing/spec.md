# catalog-browsing Specification

## Purpose

TBD - created by archiving change swhr-i-0006-catalog-browsing-and-search. Update Purpose after archive.

## Requirements

### Requirement: Catalog category records

ID: SWHR-R-0084

The system SHALL store catalog categories, each identified by a unique category identifier of at most 10 characters, with per-locale details keyed by category identifier and locale. Each details row MUST carry a name of at most 80 characters and MAY carry an image reference and a description of at most 255 characters each. Every details row MUST reference an existing category, and there SHALL be at most one details row per category and locale.

#### Scenario: Category details stored for two locales

ID: SWHR-R-0084.01

- **GIVEN** a category "DOGS" with details in locales en_US and ja_JP
- **WHEN** the category is read in locale ja_JP
- **THEN** the Japanese name and description are returned and the category identifier is "DOGS" in both locales

#### Scenario: Category details without a name are rejected

ID: SWHR-R-0084.02

- **GIVEN** a category "DOGS"
- **WHEN** a details row for locale en_US is saved without a name
- **THEN** the save is rejected

#### Scenario: Duplicate details for the same locale are rejected

ID: SWHR-R-0084.03

- **GIVEN** a category "DOGS" that already has en_US details
- **WHEN** a second en_US details row for "DOGS" is saved
- **THEN** the save is rejected

### Requirement: Catalog product records

ID: SWHR-R-0085

The system SHALL store products, each identified by a unique product identifier of at most 10 characters and belonging to exactly one existing category, with per-locale details keyed by product identifier and locale. Each details row MUST carry a name of at most 80 characters and MAY carry an image reference and a description.

#### Scenario: Product belongs to one category

ID: SWHR-R-0085.01

- **GIVEN** a product "K9-BD-01" (Bulldog) in category "DOGS"
- **WHEN** the products of category "DOGS" are listed
- **THEN** "K9-BD-01" is included, and it is not included in the listing of any other category

#### Scenario: Product referencing a missing category is rejected

ID: SWHR-R-0085.02

- **GIVEN** no category "LIZARDS" exists
- **WHEN** a product is saved with category "LIZARDS"
- **THEN** the save is rejected

### Requirement: Catalog item records

ID: SWHR-R-0086

The system SHALL store items (the purchasable variant of a product), each identified by a unique item identifier of at most 10 characters and belonging to exactly one existing product, with per-locale details keyed by item identifier and locale. Each details row MUST carry a list price and a unit cost, each a decimal amount with 2 fractional digits and at most 10 digits, an image reference and a description, and MAY carry up to five free-text attributes of at most 80 characters each.

#### Scenario: Item prices are held to two decimal places

ID: SWHR-R-0086.01

- **GIVEN** an item "EST-6" with en_US details, list price 18.50 and unit cost 12.00
- **WHEN** the item is read in locale en_US
- **THEN** the list price 18.50 and unit cost 12.00 are returned exactly, without floating-point rounding

#### Scenario: Item details without a price are rejected

ID: SWHR-R-0086.02

- **GIVEN** an item "EST-6"
- **WHEN** an en_US details row is saved without a unit cost
- **THEN** the save is rejected

### Requirement: Locale-scoped catalog visibility

ID: SWHR-R-0087

The system SHALL show a category, product or item in a locale only when localized details exist for it in that locale, and an item SHALL be listed only when both its item details and its product details exist in that locale.

#### Scenario: Item without details in the shopper's locale is hidden

ID: SWHR-R-0087.01

- **GIVEN** item "EST-15" has en_US and zh_CN details but no ja_JP details
- **WHEN** a shopper browsing in ja_JP lists the items of its product or runs a search that would match it
- **THEN** "EST-15" is not returned

#### Scenario: Category without details in the locale is omitted from the category list

ID: SWHR-R-0087.02

- **GIVEN** category "REPTILES" has en_US details only
- **WHEN** categories are listed in locale zh_CN
- **THEN** "REPTILES" is not in the list

### Requirement: Category listing

ID: SWHR-R-0088

The system SHALL list all categories that have details in the requested locale, ordered by localized category name.

#### Scenario: Categories listed alphabetically

ID: SWHR-R-0088.01

- **GIVEN** categories named Reptiles, Birds, Dogs, Cats and Fish in en_US
- **WHEN** categories are listed in en_US
- **THEN** they are returned in the order Birds, Cats, Dogs, Fish, Reptiles

### Requirement: Product listing for a category

ID: SWHR-R-0089

The system SHALL list the products of a given category that have details in the requested locale, ordered by localized product name, returning each product's identifier, name and description.

#### Scenario: Products of a category listed alphabetically

ID: SWHR-R-0089.01

- **GIVEN** category "DOGS" contains products named Poodle, Bulldog and Dalmation in en_US
- **WHEN** the products of "DOGS" are listed in en_US
- **THEN** they are returned in the order Bulldog, Dalmation, Poodle

#### Scenario: Unknown category yields an empty listing

ID: SWHR-R-0089.02

- **GIVEN** no category "UNICORNS" exists
- **WHEN** the products of "UNICORNS" are listed
- **THEN** an empty page is returned and no error is raised

### Requirement: Item listing for a product

ID: SWHR-R-0090

The system SHALL list the items of a given product that have details in the requested locale, returning for each item its item identifier, its own product identifier and category identifier, the localized product name, image reference, description, attributes, list price and unit cost.

#### Scenario: Items of a product carry their own identifiers

ID: SWHR-R-0090.01

- **GIVEN** product "K9-BD-01" in category "DOGS" with items "EST-6" and "EST-7"
- **WHEN** the items of "K9-BD-01" are listed in en_US
- **THEN** both items are returned, each with product identifier "K9-BD-01" and category identifier "DOGS"

### Requirement: Single catalog entry lookup

ID: SWHR-R-0091

The system SHALL return the details of a single category, product or item by identifier in the requested locale; an item lookup SHALL return its category identifier, product identifier, localized product name, image reference, description, five attributes, list price and unit cost. A lookup of an identifier that does not exist, or that has no details in the requested locale, SHALL return no result rather than an error.

#### Scenario: Item found

ID: SWHR-R-0091.01

- **GIVEN** item "EST-6" with en_US details
- **WHEN** item "EST-6" is looked up in en_US
- **THEN** its category, product, product name, image, description, attributes, list price and unit cost are returned

#### Scenario: Item missing in the requested locale

ID: SWHR-R-0091.02

- **GIVEN** item "EST-15" has no ja_JP details
- **WHEN** item "EST-15" is looked up in ja_JP
- **THEN** no result is returned and no error is raised

### Requirement: Search keyword parsing

ID: SWHR-R-0092

The system SHALL split a search query into keywords on whitespace and discard duplicate keywords. A query that is empty or contains only whitespace SHALL produce an empty result without querying the catalog.

#### Scenario: Duplicate keywords collapse

ID: SWHR-R-0092.01

- **GIVEN** the query "dog dog puppy"
- **WHEN** a search is run
- **THEN** the keywords searched are exactly "dog" and "puppy"

#### Scenario: Blank query

ID: SWHR-R-0092.02

- **GIVEN** the query " "
- **WHEN** a search is run
- **THEN** an empty result page is returned with no next or previous page

### Requirement: Search keyword matching

ID: SWHR-R-0093

The system SHALL return, for a keyword search in a locale, every item with details in that locale for which ANY keyword occurs as a substring of the localized product name, the category identifier or the localized item description. Matching SHALL be case-insensitive.

#### Scenario: Any keyword matches

ID: SWHR-R-0093.01

- **GIVEN** en_US items whose product names are "Bulldog" and "Goldfish"
- **WHEN** the query "bull fish" is searched in en_US
- **THEN** items of both products are returned

#### Scenario: Case-insensitive match

ID: SWHR-R-0093.02

- **GIVEN** an en_US item whose product name is "Bulldog"
- **WHEN** the query "BULL" is searched in en_US
- **THEN** that item is returned

#### Scenario: Category identifier matches

ID: SWHR-R-0093.03

- **GIVEN** items in category "FISH"
- **WHEN** the query "fish" is searched
- **THEN** every item in category "FISH" with details in the locale is returned

### Requirement: Paged catalog listings

ID: SWHR-R-0094

The system SHALL return product listings, item listings and search results one page at a time, given a zero-based start offset and a maximum page size, and each page SHALL report whether a next page exists (true only when at least one further result exists beyond the page). The next page SHALL start at the current start plus the number of results on the current page. A negative start offset, or one at or beyond the number of results, SHALL yield an empty page with no next page and no previous page.

#### Scenario: Middle page

ID: SWHR-R-0094.01

- **GIVEN** a product with 5 items in en_US
- **WHEN** items are requested with start 2 and page size 2
- **THEN** the 3rd and 4th items are returned, a next page exists and starts at 4

#### Scenario: Last page

ID: SWHR-R-0094.02

- **GIVEN** a product with 5 items in en_US
- **WHEN** items are requested with start 4 and page size 2
- **THEN** only the 5th item is returned and no next page exists

#### Scenario: Start beyond the last result

ID: SWHR-R-0094.03

- **GIVEN** a product with 5 items in en_US
- **WHEN** items are requested with start 9
- **THEN** an empty page is returned with no next and no previous page and no error is raised

### Requirement: Previous-page navigation

ID: SWHR-R-0095

The system SHALL report a previous page whenever the current page does not start at the first result, and the previous page SHALL start at the current start minus the number of results on the current page, never below zero.

#### Scenario: Previous from a full page

ID: SWHR-R-0095.01

- **GIVEN** a page starting at 4 containing 2 results
- **WHEN** the previous page is requested
- **THEN** it starts at 2

#### Scenario: First page has no previous page

ID: SWHR-R-0095.02

- **GIVEN** a page starting at 0
- **WHEN** the page is displayed
- **THEN** no previous page is offered

### Requirement: Default storefront page size

ID: SWHR-R-0096

The storefront SHALL open a category product listing, a product item listing and search results at the first result with a page size of 2 when no paging parameters are supplied.

#### Scenario: Fresh listing

ID: SWHR-R-0096.01

- **GIVEN** a category with 5 products
- **WHEN** the category is opened with no paging parameters
- **THEN** the first 2 products are shown and a Next link is offered

### Requirement: Anonymous catalog access

ID: SWHR-R-0097

The system SHALL allow any caller, signed on or not, to read categories, products, items and search results.

#### Scenario: Visitor who is not signed on browses

ID: SWHR-R-0097.01

- **GIVEN** a visitor who has not signed on
- **WHEN** the visitor opens a category, a product, an item or a search
- **THEN** the catalog content is shown and no sign-on is requested

### Requirement: Read-only catalog operations and failure behaviour

ID: SWHR-R-0098

The catalog browsing operations SHALL NOT modify catalog data. When the catalog store is unavailable or a catalog query fails, the operation MUST fail with a catalog error carrying the underlying message and MUST NOT return a partial result; no retry SHALL be attempted.

#### Scenario: Catalog store unavailable

ID: SWHR-R-0098.01

- **GIVEN** the catalog store cannot be reached
- **WHEN** a category listing is requested
- **THEN** the request fails with a catalog error and no partial listing is returned

### Requirement: Cached catalog listings

ID: SWHR-R-0099

The system MAY serve category listings, product listings and the category navigation menu from a shared cache for up to 5 minutes, so catalog changes MAY take up to 5 minutes to appear. A cached listing MUST be keyed by at least the request address, including its query string, and the locale, so one category's, product's, page's or locale's content is never served for another.

#### Scenario: Cached listing expires

ID: SWHR-R-0099.01

- **GIVEN** the product listing of "DOGS" was rendered 6 minutes ago and a product has since been added
- **WHEN** the listing is requested again
- **THEN** the listing is regenerated and the new product appears

#### Scenario: Cache does not cross categories

ID: SWHR-R-0099.02

- **GIVEN** the product listing of "DOGS" is cached
- **WHEN** the product listing of "CATS" is requested
- **THEN** the products of "CATS" are shown

### Requirement: Catalog seed data

ID: SWHR-R-0100

The system SHALL load the bundled catalog and demonstration account data the first time the store is entered when that data is not already present, and SHALL offer a forced reload that deletes and recreates the catalog data and ends the requester's session.

#### Scenario: First entry into an empty store

ID: SWHR-R-0100.01

- **GIVEN** the catalog tables contain no data
- **WHEN** a visitor enters the store
- **THEN** the bundled catalog is loaded before the home page is shown

#### Scenario: Entry into an already populated store

ID: SWHR-R-0100.02

- **GIVEN** the catalog, customer and sign-on data are already present
- **WHEN** a visitor enters the store without requesting a forced reload
- **THEN** no data is reloaded

### Requirement: Catalog browsing navigation

ID: SWHR-R-0101

The storefront SHALL let a shopper navigate from the home page to a category, from a category to one of its products, and from a product to its list of items, with an Add to Cart action on each item row.

#### Scenario: Browse to a bulldog

ID: SWHR-R-0101.01

- **GIVEN** the seeded catalog
- **WHEN** the shopper selects Dogs on the home page and then Bulldog
- **THEN** the Bulldog items such as "Male Adult Bulldog" are listed, each row with an Add to Cart action

### Requirement: Storefront home category map

ID: SWHR-R-0102

The home page SHALL present a pet picture map whose regions link to the Birds, Fish, Dogs, Reptiles and Cats category listings.

#### Scenario: Selecting a region

ID: SWHR-R-0102.01

- **GIVEN** the home page is displayed
- **WHEN** the shopper selects the Fish region
- **THEN** the product listing of the Fish category is shown

#### Scenario: All five categories are reachable

ID: SWHR-R-0102.02

- **GIVEN** the home page is displayed
- **WHEN** the shopper inspects the picture map
- **THEN** it offers regions for Birds, Fish, Dogs, Reptiles and Cats and no other destinations

### Requirement: Item detail page

ID: SWHR-R-0103

The item detail page SHALL display the item's attribute and product name as its title, the item image, the list price labelled "List Price", the unit cost labelled "Your Price", both formatted as currency for the shopper's locale, and an Add to Cart control that adds that item to the shopper's cart.

#### Scenario: Item detail displayed

ID: SWHR-R-0103.01

- **GIVEN** item "EST-6" (attribute "Male Adult", product "Bulldog", list price 18.50, unit cost 12.00)
- **WHEN** its detail page is opened in en_US
- **THEN** the title reads "Male Adult Bulldog", the image is shown, "List Price: $18.50" and "Your Price: $12.00" are displayed, and an Add to Cart control is offered

#### Scenario: Add to Cart from the item detail page

ID: SWHR-R-0103.02

- **GIVEN** the detail page of item "EST-6" is displayed
- **WHEN** the shopper activates Add to Cart
- **THEN** item "EST-6" is added to the shopper's cart

### Requirement: Category navigation menu

ID: SWHR-R-0104

Every storefront page SHALL show a "Pets" navigation menu listing the categories available in the current locale, ordered by category name, each linking to that category's product listing.

#### Scenario: Menu on every page

ID: SWHR-R-0104.01

- **GIVEN** the seeded catalog in en_US
- **WHEN** any storefront page is displayed
- **THEN** a "Pets" menu lists Birds, Cats, Dogs, Fish and Reptiles, and selecting Cats opens the Cats product listing

### Requirement: Category product listing page

ID: SWHR-R-0105

The category page SHALL list the category's products for the current locale ordered by product name, showing each product's name as a link to its item listing and its description, with a Previous link only when an earlier page exists and a Next link only when a later page exists.

#### Scenario: Category page with more products than one page

ID: SWHR-R-0105.01

- **GIVEN** category "DOGS" has 6 products in en_US
- **WHEN** the category page is opened with no paging parameters
- **THEN** the first 2 products are shown with name and description, a Next link is shown and no Previous link is shown

#### Scenario: Selecting a product

ID: SWHR-R-0105.02

- **GIVEN** the category page of "DOGS" is displayed
- **WHEN** the shopper selects Bulldog
- **THEN** the item listing of Bulldog is shown

### Requirement: Product item listing page

ID: SWHR-R-0106

The product page SHALL list the product's items for the current locale, showing each item's attribute and product name as a link to its item detail page, its description, its list price formatted as currency and an Add to Cart control, with Previous and Next links shown only when an earlier or later page exists.

#### Scenario: Product page displayed

ID: SWHR-R-0106.01

- **GIVEN** product Bulldog has items "Male Adult" and "Female Puppy" in en_US
- **WHEN** the product page is opened
- **THEN** each row shows "Male Adult Bulldog" or "Female Puppy Bulldog" linked to its detail page, the item description, the list price and an Add to Cart control

#### Scenario: Add to Cart from the product page

ID: SWHR-R-0106.02

- **GIVEN** the product page of Bulldog is displayed
- **WHEN** the shopper activates Add to Cart on the "Male Adult Bulldog" row
- **THEN** that item is added to the shopper's cart

### Requirement: Search results page

ID: SWHR-R-0107

The search results page SHALL show "Items matching any of:" followed by the submitted keywords, then one row per matching item with its attribute and product name linked to its item detail page, its description, its unit cost formatted as currency and an Add to Cart control, with Previous and Next links shown only when an earlier or later page exists. When the keyword field is empty or nothing matches, the page SHALL show "No results were found for your search." and no result rows.

#### Scenario: Matching items displayed

ID: SWHR-R-0107.01

- **GIVEN** the en_US catalog contains Bulldog items
- **WHEN** the shopper searches for "bulldog"
- **THEN** the page shows "Items matching any of: bulldog" and one row per Bulldog item with name, description, unit cost and Add to Cart

#### Scenario: Nothing matches

ID: SWHR-R-0107.02

- **GIVEN** no item matches "zebra"
- **WHEN** the shopper searches for "zebra"
- **THEN** the page shows "No results were found for your search." and no rows

#### Scenario: Empty keyword field

ID: SWHR-R-0107.03

- **GIVEN** the search page
- **WHEN** the shopper submits an empty keyword field
- **THEN** the page shows "No results were found for your search."
