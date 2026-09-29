## MODIFIED Requirements

### Requirement: Global navigation

ID: SWHR-R-0002

The application SHALL render one global navigation on every page, with an entry for each primary area and a link back to the landing page. Each primary-area entry's visible label SHALL be shown in the effective locale.

#### Scenario: Navigation is present on every page

ID: SWHR-R-0002.01

- **WHEN** a user opens any page
- **THEN** the global navigation is shown
- **AND** it includes a link back to the landing page

#### Scenario: Primary-area labels in Japanese

ID: SWHR-R-0002.02

- **GIVEN** a session whose locale is `ja_JP`
- **WHEN** the user opens the menu on a narrow screen
- **THEN** its storefront entries read 検索, カート, 購入手続き, アカウント, 管理 and サプライヤー, and no entry reads Search, Cart, Checkout, Account, Administration or Supplier

#### Scenario: Primary-area labels in Simplified Chinese

ID: SWHR-R-0002.03

- **GIVEN** a session whose locale is `zh_CN`
- **WHEN** the user opens any page on a wide screen
- **THEN** the global navigation's search and checkout entries read 搜索 and 结账

#### Scenario: Primary-area labels in the default locale

ID: SWHR-R-0002.04

- **GIVEN** a session whose locale is `en_US`
- **WHEN** the user opens the menu on a narrow screen
- **THEN** its storefront entries read Search, Cart, Checkout, Account, Administration and Supplier
