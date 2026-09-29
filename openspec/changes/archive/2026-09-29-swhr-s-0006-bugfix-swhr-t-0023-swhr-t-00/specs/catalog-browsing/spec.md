## MODIFIED Requirements

### Requirement: Category navigation menu

ID: SWHR-R-0104

Every storefront page SHALL show a "Pets" navigation menu listing the categories available in the current locale, ordered by category name, each linking to that category's product listing.

#### Scenario: Menu on every page

ID: SWHR-R-0104.01

- **GIVEN** the seeded catalog in en_US
- **WHEN** any storefront page is displayed
- **THEN** a "Pets" menu lists Birds, Cats, Dogs, Fish and Reptiles, and selecting Cats opens the Cats product listing

#### Scenario: Menu in Japanese

ID: SWHR-R-0104.02

- **GIVEN** the seeded catalog and a session whose locale is `ja_JP`
- **WHEN** the user opens the menu on a narrow screen
- **THEN** its pet entries read 鳥, 猫, 犬, 魚 and 爬虫類, and none reads Birds, Cats, Dogs, Fish or Reptiles

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

#### Scenario: Category heading in Japanese

ID: SWHR-R-0105.03

- **GIVEN** the seeded catalog and a session whose locale is `ja_JP`
- **WHEN** the category page of "DOGS" is opened
- **THEN** the page heading reads 犬
