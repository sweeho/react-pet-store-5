## Why

The legacy Java Pet Store 1.3.2 storefront serves customers in English, Japanese and Simplified Chinese. Localization is not one module. It is spread across the front controller, the screen renderer, the catalog, the cart, the customer profile, purchase orders, the order-processing email templates, the request-encoding filter and the administrator client. The rebuild has to reproduce the locale rules customers actually experience: which language they see, when that language changes, which catalog data and prices they are shown, and which language their order emails arrive in. Most of these rules exist only in code and have never been written down. This change records them as testable requirements, extracted from 25 reviewed IR records (56 pass-level records) under `capability_key: localization`.

## What Changes

- Add the `localization` capability as a new delta spec covering:
  - the supported storefront locales and the default locale
  - how the session locale is assigned, changed, validated and propagated to the cart and server-side state
  - switching to the customer's preferred language at sign-on and on profile save
  - locale identifier interpretation (`language_COUNTRY`, `default`)
  - per-locale page resolution with fallback to the default locale
  - per-locale catalog content with no cross-locale fallback
  - per-locale price display and email price formats
  - the order locale and localized customer emails
  - locale-specific state/province options on the order form
  - UTF-8 request and response handling
  - administrator-client string catalogues
  - the locale selection screen
- Record the known legacy defects and disputed rules (variant parsing, the zh_CN dollar format, emails failing instead of falling back, a German option the storefront does not support, suspected dead code) in `design.md` as open questions. The spec does not silently resolve them.

## Capabilities

### New Capabilities

- `localization`: the locale model of the storefront. Covers supported locales, session and customer locale, locale switching, locale-specific pages, catalog data, prices, order emails, form options, character encoding and administrator-client strings.

### Modified Capabilities

- None.

## Impact

- **Data model**: a `locale` column keys the catalog detail tables (category, product and item details). The customer profile stores a preferred language. Purchase orders store a locale. The shopping cart holds a locale.
- **Server**: all request middleware decodes UTF-8. The locale-change endpoint and the sign-on and profile-save paths update the session locale and the cart locale. Order-notification email rendering selects templates by locale.
- **SPA**: every page is rendered per locale, with default-locale fallback. The page header offers three language switches that return the visitor to the page they were on. Prices are formatted per page locale. The order form uses per-locale state/province lists.
- **Cross-capability**: this capability touches catalog, cart, customer/sign-on, order processing and notification. Their own specs own their core rules. This one owns only the locale dimension.
