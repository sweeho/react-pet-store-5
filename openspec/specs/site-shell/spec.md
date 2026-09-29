# site-shell Specification

## Purpose

TBD - created by archiving change swhr-i-0002-bootstrap-landing-page-and-s. Update Purpose after archive.

## Requirements

### Requirement: Landing page

ID: SWHR-R-0001

The application SHALL serve a landing page at its root route that introduces the product and links to every primary area.

#### Scenario: A user opens the root route

ID: SWHR-R-0001.01

- **WHEN** a user opens the application's root URL
- **THEN** the landing page is shown
- **AND** it links to every primary area of the application

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

### Requirement: Shared page layout

ID: SWHR-R-0003

The application SHALL render every page inside one shared layout with a common header and footer.

#### Scenario: A page renders inside the shell

ID: SWHR-R-0003.01

- **WHEN** a user opens any page
- **THEN** the page content renders inside the shared header, navigation and footer

### Requirement: Shared state frames

ID: SWHR-R-0004

The application SHALL provide shared empty, error and loading frames that every page reuses.

#### Scenario: A page has nothing to show

ID: SWHR-R-0004.01

- **WHEN** a page has no data to display
- **THEN** it renders the shared empty frame

#### Scenario: A page fails to load

ID: SWHR-R-0004.02

- **WHEN** a page's data cannot be loaded
- **THEN** it renders the shared error frame with a way to retry
