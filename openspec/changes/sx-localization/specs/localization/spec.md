## ADDED Requirements

### Requirement: Supported storefront locales

The storefront SHALL support exactly three locales: US English (`en_US`), Japanese (`ja_JP`) and Simplified Chinese (`zh_CN`). `en_US` SHALL be the default locale. Every customer-facing page MUST be available in each supported locale. Adding a further locale SHOULD require only that locale's page content, page definitions and catalog data, with no code change.

#### Scenario: Every page exists in every supported locale

- **GIVEN** the storefront is deployed with its standard locale set
- **WHEN** any customer-facing page is requested in `en_US`, `ja_JP` or `zh_CN`
- **THEN** that page is rendered with content authored for the requested locale

#### Scenario: Default locale

- **GIVEN** the storefront deployment configuration
- **WHEN** the default locale is read
- **THEN** it is `en_US`

### Requirement: Default session locale

The system SHALL assign the configured default locale (`en_US` in the storefront deployment) to every visitor session that has no locale yet. This SHALL happen before the visitor's first request is processed. The default locale MUST be a deployment setting, not a code constant.

#### Scenario: New visitor receives the default locale

- **GIVEN** a new visitor session with no locale set
- **WHEN** the visitor's first request arrives
- **THEN** the session locale is set to `en_US` and the request is processed in `en_US`

#### Scenario: Existing session locale is preserved

- **GIVEN** a session whose locale is already `ja_JP`
- **WHEN** a further request arrives
- **THEN** the session locale remains `ja_JP`

### Requirement: Locale identifier interpretation

The system SHALL interpret a locale identifier of the form `language_COUNTRY` (for example `en_US`, `ja_JP`, `zh_CN`) as that language and country. It SHALL treat the identifier `default`, compared case-insensitively, as the server's default locale. An identifier with no underscore separator, or an absent identifier, MUST NOT yield a locale. The rebuild MUST NOT rely on any meaning for a three-part `language_COUNTRY_VARIANT` identifier. The same interpretation SHALL apply to the configured default locale, a locale-change request, a customer's stored preferred language and the locale stored on an order.

#### Scenario: Two-part identifier

- **GIVEN** the identifier `ja_JP`
- **WHEN** it is interpreted
- **THEN** the result is the Japanese language with country Japan

#### Scenario: The literal default

- **GIVEN** the identifier `DEFAULT`
- **WHEN** it is interpreted
- **THEN** the result is the server's default locale

#### Scenario: Identifier without a separator

- **GIVEN** the identifier `en`
- **WHEN** it is interpreted
- **THEN** no locale results and the identifier is treated as invalid

### Requirement: Language switching from every page

Every storefront page SHALL offer the visitor a way to switch the display language to English, Japanese or Chinese. A successful switch SHALL replace the session locale and SHALL set the shopping cart's locale to the new value. It SHALL then return the visitor to the page they were viewing, re-rendered in the new locale with that page's request data restored, not to a fixed landing page.

#### Scenario: Switching language on a product page

- **GIVEN** a visitor viewing a product page in English with items in their cart
- **WHEN** the visitor chooses Japanese
- **THEN** the same product page is shown again in Japanese, the session locale is `ja_JP`, and the cart's item details are subsequently shown in `ja_JP`

#### Scenario: Switch available on every page

- **GIVEN** any storefront page
- **WHEN** it is displayed
- **THEN** controls to switch to English (`en_US`), Japanese (`ja_JP`) and Chinese (`zh_CN`) are present

### Requirement: Rejected locale change

The system MUST reject a locale-change request whose identifier cannot be interpreted as a locale. It SHALL leave the session locale unchanged and SHALL report the error "Unable to change language to <identifier>".

#### Scenario: Unparseable locale code

- **GIVEN** a session whose locale is `en_US`
- **WHEN** a locale change to `ja` is requested
- **THEN** the request fails with the error "Unable to change language to ja" and the session locale remains `en_US`

### Requirement: Locale change reaches server-side business state

WHEN a visitor's locale changes, the system SHALL make the new locale available to that visitor's server-side business processing. Later business operations for the visitor MUST then run under the chosen locale.

#### Scenario: Business operation after a switch

- **GIVEN** a visitor who has switched from `en_US` to `zh_CN`
- **WHEN** a later business operation for that visitor reads the visitor's locale
- **THEN** it reads `zh_CN`

### Requirement: Preferred language applied at sign-on and profile save

WHEN a customer signs on, the system SHALL switch the session locale and the cart locale to the customer's stored preferred language. It SHALL do the same WHEN a customer saves their account profile. A user who has a sign-on account but no customer profile yet SHALL keep their current locale until a profile is saved, and sign-on MUST NOT fail because the profile is missing.

#### Scenario: Customer with a Japanese preference signs on

- **GIVEN** a visitor browsing in `en_US` and a customer whose preferred language is `ja_JP`
- **WHEN** that customer signs on
- **THEN** the session locale and the cart locale become `ja_JP`

#### Scenario: Preference changed in the profile

- **GIVEN** a signed-on customer browsing in `en_US`
- **WHEN** the customer saves their profile with preferred language `zh_CN`
- **THEN** the session locale and the cart locale become `zh_CN`

#### Scenario: New account without a profile

- **GIVEN** a user who has just created a sign-on account and has no customer profile
- **WHEN** the user signs on
- **THEN** sign-on succeeds and the session locale is unchanged

### Requirement: Customer preferred language

The system SHALL store each customer's preferred language as a locale identifier (for example `en_US`). The value SHALL default to `en_US` when none is given.

#### Scenario: Profile created without a language

- **GIVEN** a new customer profile created without a preferred language
- **WHEN** the profile is stored
- **THEN** its preferred language is `en_US`

### Requirement: Locale-specific page resolution

The system SHALL render each page using the page definition for the effective locale. A locale named explicitly on the request SHALL take precedence over the session locale for that request only. IF no page definitions are installed for the effective locale, the default locale's definitions SHALL be used. IF the effective locale does not define the requested page, the default locale's definition of that page SHALL be used. IF neither defines the page, the system SHALL show an error stating that the definition for that page was not found.

#### Scenario: Request locale overrides session locale

- **GIVEN** a session whose locale is `en_US`
- **WHEN** a page is requested with an explicit locale of `ja_JP`
- **THEN** the Japanese definition of the page is rendered and the session locale remains `en_US`

#### Scenario: Locale with no installed definitions

- **GIVEN** an effective locale `de_DE` for which no page definitions are installed
- **WHEN** a page is requested
- **THEN** the `en_US` definition of that page is rendered

#### Scenario: Page missing in the effective locale

- **GIVEN** an effective locale `zh_CN` whose definitions omit a page that `en_US` defines
- **WHEN** that page is requested
- **THEN** the `en_US` definition of the page is rendered

#### Scenario: Page defined nowhere

- **GIVEN** a page name defined in no locale
- **WHEN** it is requested
- **THEN** an error stating "Definition for screen <name> not found" is shown

### Requirement: Locale-specific catalog content

The system SHALL store category, product and item names, descriptions, images and prices separately per locale. It SHALL select them by the requested locale. An item SHALL be returned only when both the item's details and its product's details exist in that same locale. A category, product or item with no details in the requested locale MUST be reported as not found. The system MUST NOT fall back to another locale.

#### Scenario: Item shown in the requested locale

- **GIVEN** an item whose details exist in `en_US` and `ja_JP`
- **WHEN** the item is requested in `ja_JP`
- **THEN** the Japanese name, description, image and price are returned

#### Scenario: No details in the requested locale

- **GIVEN** a product whose details exist only in `en_US`
- **WHEN** the product is requested in `zh_CN`
- **THEN** the product is reported as not found and no English details are substituted

#### Scenario: Item whose product lacks the locale

- **GIVEN** an item with `ja_JP` details whose product has no `ja_JP` details
- **WHEN** items are listed in `ja_JP`
- **THEN** the item is not included

### Requirement: Locale-specific price display

The system SHALL display catalog and cart prices using the price held for the page's locale. It SHALL format that price in the currency convention of the page's locale: US format for English pages, Japanese format for Japanese pages and Chinese format for Chinese pages. It MUST NOT perform any currency conversion.

#### Scenario: Same item viewed in two locales

- **GIVEN** an item whose `en_US` list price is 18.50 and whose `ja_JP` list price is 2000
- **WHEN** the item is viewed on an English page and then on a Japanese page
- **THEN** the English page shows 18.50 in US currency format and the Japanese page shows 2000 in Japanese currency format, with no conversion between them

### Requirement: Shopping cart locale

The shopping cart SHALL present item details and prices in the cart's current locale. The cart locale SHALL default to `en_US` until it is set. It MAY be changed at any time by a language switch or by sign-on.

#### Scenario: Cart before any locale is set

- **GIVEN** a new cart whose locale has never been set
- **WHEN** its items are listed
- **THEN** item names and prices are taken from the `en_US` catalog details

### Requirement: Purchase order locale

The system SHALL record a locale on every purchase order. The locale SHALL default to `en_US` when the order does not specify one.

#### Scenario: Order submitted without a locale

- **GIVEN** a purchase order that carries no locale
- **WHEN** it is stored
- **THEN** its recorded locale is `en_US`

### Requirement: Localized customer emails

The system SHALL render every customer email (order approval status, shipment and order completed) in the locale recorded on the order. It SHALL provide templates for `en_US`, `ja_JP` and `zh_CN` for each email type. IF the order locale cannot be resolved, the locale-neutral default template SHALL be used. IF the order's locale resolves but no template exists for it, email generation SHALL fail and MUST NOT fall back to another language.

#### Scenario: Japanese order

- **GIVEN** an order whose locale is `ja_JP`
- **WHEN** its shipment email is generated
- **THEN** the email is rendered from the Japanese shipment template

#### Scenario: Unresolvable order locale

- **GIVEN** an order whose stored locale has no underscore separator
- **WHEN** its approval email is generated
- **THEN** the email is rendered from the default template

#### Scenario: Locale with no template

- **GIVEN** an order whose locale is `de_DE`
- **WHEN** an email is generated
- **THEN** generation fails with an error stating that no template was found for the locale and no email is produced

### Requirement: Email price formats

In customer emails, unit prices SHALL be formatted as `$#,##0.00` (dollar sign, thousands separators, two decimals) for the default, `en_US` and `zh_CN` templates. They SHALL be formatted as `￥#,##0` (yen sign, thousands separators, no decimals) for the `ja_JP` template.

#### Scenario: Price in an English email

- **GIVEN** an order line with unit price 1234.5 on an `en_US` order
- **WHEN** the completed-order email is rendered
- **THEN** the unit price reads `$1,234.50`

#### Scenario: Price in a Japanese email

- **GIVEN** an order line with unit price 2000 on a `ja_JP` order
- **WHEN** the completed-order email is rendered
- **THEN** the unit price reads `￥2,000`

### Requirement: Locale-specific state and province options

The order information form SHALL offer state/province choices specific to the page's locale. English pages SHALL offer California, New York and Texas. Japanese pages SHALL offer Tokyo, Osaka and Nagano. Chinese pages SHALL offer Beijing, Shanghai and Jiangsu.

#### Scenario: Japanese order form

- **GIVEN** a customer checking out on Japanese pages
- **WHEN** the order information form is displayed
- **THEN** the state/province choices are Tokyo, Osaka and Nagano

### Requirement: UTF-8 request and response encoding

The system SHALL decode the parameters and body of every incoming storefront request as UTF-8 before any request handling reads them. This includes sign-on and access-control checks. It SHALL write responses as UTF-8. Japanese and Chinese text MUST be received and returned without corruption.

#### Scenario: Japanese text on account creation

- **GIVEN** a customer submits the account-creation form with a Japanese name
- **WHEN** the request is processed, including the sign-on check
- **THEN** the stored and redisplayed name is identical to the submitted Japanese text

### Requirement: Administrator client string catalogue

The administrator client SHALL take every user-visible label, message, tooltip and mnemonic from a locale-specific message catalogue. It SHALL provide an English default catalogue and a German catalogue.

#### Scenario: German administrator

- **GIVEN** the administrator client running under a German locale
- **WHEN** its main window is displayed
- **THEN** labels, tooltips and mnemonics are taken from the German catalogue

### Requirement: Locale selection screen

The system SHALL provide a locale selection screen. It SHALL display a single choice list of locales, labelled US English (`en_US`), German (`de_DE`), Japanese (`ja_JP`) and Simplified Chinese (`zh_CN`), and a Change Locale control. The Change Locale control SHALL submit the chosen locale code to the locale-change operation. After a successful change, the system SHALL display a confirmation screen showing the locale now in effect for the session. After a rejected change, the session locale MUST remain unchanged.

#### Scenario: Locale selection screen is displayed

- **GIVEN** a visitor opens the locale selection screen
- **WHEN** the screen is displayed
- **THEN** it shows a choice list with the options US English, German, Japanese and Simplified Chinese, and a Change Locale control

#### Scenario: A locale is chosen and submitted

- **GIVEN** the locale selection screen with Japanese selected
- **WHEN** the visitor activates Change Locale
- **THEN** the session locale becomes `ja_JP` and a confirmation screen showing `ja_JP` as the locale in effect is displayed
