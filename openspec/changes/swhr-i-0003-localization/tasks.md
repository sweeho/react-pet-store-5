## 1. Locale model

- [x] 1.1 Define the supported-locale list (en_US, ja_JP, zh_CN) and the default locale as deployment configuration (SWHR-T-0013)
- [x] 1.2 Implement the single locale identifier parser (language_COUNTRY, case-insensitive "default", reject no-underscore and absent input) (SWHR-T-0013)
- [x] 1.3 Unit-test the parser, including the three-part identifier case being rejected rather than guessed (SWHR-T-0013)

## 2. Session locale

- [x] 2.1 Add server middleware that assigns the default locale to a session with none before the request is handled (SWHR-T-0014)
- [x] 2.2 Implement the locale-change endpoint that validates the identifier and updates the session locale (SWHR-T-0014)
- [x] 2.3 Return the "Unable to change language to <identifier>" error and leave the session untouched on a rejected change (SWHR-T-0014)
- [x] 2.4 Set the cart locale on every successful locale change (SWHR-T-0014)
- [x] 2.5 Expose the session locale to server-side business operations for the visitor (SWHR-T-0014)
- [x] 2.6 Integration-test default assignment, successful change and rejected change (SWHR-T-0014)

## 3. Preferred language

- [x] 3.1 Store the customer preferred language as a locale identifier defaulting to en_US (SWHR-T-0017)
- [x] 3.2 Apply the preferred language to session and cart on sign-on, tolerating a missing profile (SWHR-T-0017)
- [x] 3.3 Apply the preferred language to session and cart on profile save (SWHR-T-0017)
- [x] 3.4 Integration-test sign-on with a profile, sign-on without a profile and profile save (SWHR-T-0017)

## 4. Page localization

- [x] 4.1 Provide per-locale page content bundles for en_US, ja_JP and zh_CN (SWHR-T-0018)
- [x] 4.2 Resolve the effective locale with the per-request override taking precedence over the session locale without persisting it (SWHR-T-0018)
- [x] 4.3 Fall back to the default locale's content when a locale or a page is missing, and show the not-found error when no locale defines the page (SWHR-T-0018)
- [x] 4.4 Add the header language switch (English, Japanese, Chinese) to every page (SWHR-T-0018)
- [x] 4.5 Keep the visitor on the current page with its state after a switch and re-render in the new locale (SWHR-T-0018)
- [x] 4.6 UI-test the header switch and the fallback behaviour (SWHR-T-0018)

## 5. Catalog and prices

- [ ] 5.1 Key category, product and item detail rows by locale in the Drizzle schema and generate the migration (SWHR-T-0019)
- [ ] 5.2 Filter every catalog query by locale with no cross-locale fallback (SWHR-T-0019)
- [ ] 5.3 Return an item only when its item and product details share the requested locale (SWHR-T-0019)
- [ ] 5.4 Seed catalog detail data for all three locales (SWHR-T-0019)
- [ ] 5.5 Format catalog and cart prices in the page locale's currency convention using the locale's own price row (SWHR-T-0019)
- [ ] 5.6 Default the cart locale to en_US and use it for cart item lookups (SWHR-T-0019)
- [ ] 5.7 Test not-found for missing locale rows and per-locale price display (SWHR-T-0019)

## 6. Orders and emails

- [x] 6.1 Record a locale on every purchase order, defaulting to en_US (SWHR-T-0015)
- [x] 6.2 Select the customer email template (approval, shipment, completed) by order locale (SWHR-T-0015)
- [x] 6.3 Use the default template for an unresolvable order locale and fail generation when a resolved locale has no template (SWHR-T-0015)
- [x] 6.4 Apply the per-template unit price formats ($#,##0.00 for default, en_US and zh_CN; ￥#,##0 for ja_JP) (SWHR-T-0015)
- [x] 6.5 Test email template selection, failure path and price formats (SWHR-T-0015)

## 7. Forms, encoding and admin strings

- [x] 7.1 Provide the per-locale state/province option lists on the order information form (SWHR-T-0016)
- [x] 7.2 Verify UTF-8 decoding of request parameters and bodies ahead of sign-on checks and UTF-8 responses with a Japanese and Chinese round-trip test (SWHR-T-0016)
- [x] 7.3 Move administrator-facing labels, messages, tooltips and mnemonics into an English default and a German catalogue (SWHR-T-0016)

## 8. Locale selection screen

- [ ] 8.1 Build the locale selection screen with the locale choice list and Change Locale control (SWHR-T-0020)
- [ ] 8.2 Build the confirmation screen that displays the locale now in effect (SWHR-T-0020)
- [ ] 8.3 UI-test display, successful submission and a rejected submission leaving the locale unchanged (SWHR-T-0020)
