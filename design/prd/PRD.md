## Summary

React Pet Store 5 replaces Java Pet Store 1.3.2, an online pet shop, with a single TypeScript application: a React single-page storefront and back office served together with a Nitro API over one SQLite database. It keeps what the legacy system does for its three kinds of user. Shoppers browse, search, fill a cart and check out in English, Japanese or Chinese. Administrators approve or deny high-value orders and see sales by category. Supplier staff keep stock levels current, which releases waiting orders. Orders then move through approval, supplier fulfilment, invoicing and e-mail notification without anyone re-keying them.

The replacement is specified from the legacy code, not from the legacy design. Eleven capabilities, extracted from the code and listed in the Capability map, define the build. Where the legacy documents describe something the code does not do, the disagreement is recorded in `design/prd/divergences.yaml`, and this PRD states the side believed current.

## Context

The legacy system is Sun's Java Pet Store 1.3.2 J2EE blueprint (`legacy-source/petstore1.3.2/`). It is four separately deployed applications that talk over durable message queues:

- a customer storefront;
- an Order Processing Centre (OPC) with no user interface, which takes orders, applies approval rules, tracks order status and sends customer e-mail;
- an administrator console, which is a small web page that launches a desktop client;
- a supplier application that holds inventory, fills orders and issues invoices.

An order goes from the storefront to the OPC. The OPC auto-approves it or leaves it pending for an administrator, then sends a purchase order to the supplier. The supplier ships the lines it has stock for and sends invoices back. The OPC marks the order partly shipped or completed and e-mails the customer at each decision, shipment and completion.

Two legacy documents describe the system: a user manual and a product requirements document, both reconstructed in 2026. A set of screen mockups goes with them. They broadly match the code but disagree with it in nineteen places, ten of them material. Examples are the approval thresholds, the number of order statuses, how the cart is priced, which card an order is paid with, and what the supplier learns about customers. `design/prd/divergences.yaml` lists every disagreement.

The replacement collapses the four applications into one monolith on the project's pinned stack. The legacy message queues, XML-over-HTTP admin protocol and Java Web Start client are implementation details. They are not requirements. The asynchronous, durable hand-offs they provided are requirements.

## Goals

1. A visitor can find a pet, put it in a cart and check out, signing in only when checkout or the account page requires it.
2. Orders at or above a configurable threshold wait for an administrator. Orders below it pass without human involvement. The rule applies per locale and currency.
3. An approved order completes automatically once the supplier has stock for every line. Partial shipments are recorded and reported.
4. The customer is e-mailed when an order is approved or denied, when part of it ships and when it completes, in the language of the order.
5. The storefront, including catalogue content and prices, is available in English (en_US), Japanese (ja_JP) and Simplified Chinese (zh_CN).
6. Administrators can review pending orders in batches, commit decisions together, and see sales revenue and volume by category over a date range.
7. Supplier staff can set stock levels, and doing so retries fulfilment of waiting orders.
8. Placing an order never waits on approval, fulfilment or e-mail. A failure downstream delays work but never loses an order.
9. The replacement runs as one application on the pinned stack. Its behaviour is traceable to the extracted specifications.

## Non-goals

1. Real payment processing. Card details are captured and attached to orders but never authorised or charged.
2. Customer order history or order look-up after the confirmation screen.
3. Shipment tracking, carriers, shipping charges and tax.
4. Returns, refunds and order cancellation.
5. Showing stock availability to shoppers before they order.
6. Self-service password reset.
7. More than one supplier, or any sourcing decision.
8. Catalogue administration (creating or editing categories, products or items). The legacy system has none.
9. Wire compatibility with the legacy message queues, the legacy admin XML protocol or the Java Web Start client.
10. Currency conversion. Each locale carries its own prices.
11. Retry, dead-lettering or alerting for customer e-mails that fail to send.

## Users

**Shopper.** Anyone visiting the storefront. They browse, search and use the cart anonymously. They create an account (credentials, contact details, a card on file and profile preferences) and sign in to check out or to view and edit their account. They see only their own account. After the confirmation screen their only view of an order is by e-mail. Their preferences are language, favourite category, My List and pet-tips banners.

**Administrator.** Store staff holding the administrator role. They sign in to the administration console and open the order-management workspace. There they approve or deny pending orders in committed batches, view non-pending orders read-only and view sales charts. The only change they can make to an order is its approval decision.

**Supplier staff.** Warehouse staff who sign in to the supplier application. They see every stock record and replace quantities for the rows they select. Their updates are what release orders waiting on stock. In the legacy system they need the administrator role too.

## User journeys

**Shopper buys a pet**

1. Home
2. Category listing
3. Product listing
4. Item detail
5. Shopping cart
6. Sign in (shown only if the shopper is not signed in)
7. Checkout (order information)
8. Order confirmation

**Shopper finds a pet by search**

1. Home
2. Search results
3. Item detail
4. Shopping cart

**Shopper changes cart quantities**

1. Shopping cart
2. Shopping cart (after Update Cart, with zero-quantity lines removed)
3. Checkout (order information)

**New shopper creates an account**

1. Sign in
2. Create account (account information form)
3. The page originally requested, or Home

**Returning shopper signs in with a wrong password**

1. Sign in
2. Sign-in error
3. Sign in

**Shopper views and edits their account**

1. Account overview
2. Edit account (account information form)
3. Account overview

**Shopper changes language**

1. Any storefront page
2. The same page, re-rendered in the chosen language

**Shopper signs out**

1. Any storefront page
2. Signed out
3. Sign in

**Shopper checks out an empty cart**

1. Checkout (order information)
2. Empty-cart order error

**Administrator decides pending orders**

1. Administrator sign-in
2. Administrator landing page
3. Admin order review: Process Pending Orders
4. Admin order review: View Non-Pending Orders

**Administrator reviews sales**

1. Administrator sign-in
2. Administrator landing page
3. Admin sales reporting

**Supplier restocks and releases waiting orders**

1. Supplier sign-in
2. Supplier home
3. Supplier inventory
4. Inventory update confirmation

## Capability map

- localization: supported locales (en_US, ja_JP, zh_CN), session locale and switching from every page, preferred language at sign-on, per-locale pages, catalogue content, prices, form options and e-mails.
- b2b-document-exchange: the purchase-order, supplier-order and invoice document formats exchanged between the order centre and the supplier, and their validation, including SME-ruled rejection of invalid supplier orders.
- sign-on: storefront credentials, sign-in with return to the requested page, remember-user-name, protected pages, two-step registration, sign-out, session timeouts, and administrator-only access to the admin and supplier surfaces.
- catalog-browsing: the locale-aware category, product and item catalogue, keyword search, paged listings and the home, category, product, item and search screens.
- customer-account: the customer, account, contact, address, card-on-file and profile model, account registration and editing, the account page, My List and the pet-tips banner.
- shopping-cart: the session cart with add, remove, batch quantity update, subtotal and the cart screen.
- checkout: the order information form, required-field and empty-cart rules, order id generation, order contents and total, transactional asynchronous hand-off and the order complete screen.
- order-approval: automatic approval thresholds, administrator review with batched approve/deny commits, pending-only application of decisions, and sales revenue and volume reports.
- order-fulfillment: the purchase order record, the order status lifecycle (PENDING, APPROVED, DENIED, SHIPPED_PART, COMPLETED), supplier purchase orders, whole-line shipment from stock, invoices and completion.
- supplier-inventory: the supplier stock record, selected-row absolute stock updates that retry pending supplier orders, the initial stock load and the supplier screens.
- customer-notifications: the approval-decision, shipment and order-completed e-mails, each switchable, queued, localized, and logged and discarded on send failure.

## Screens

Storefront (every page carries the header with logo, search box, Account, Cart, Sign in or Sign out, the language flags, and the Pets category menu):

- Home: pet picture map linking to the five categories; a pet-tips banner when enabled.
- Category listing: the category's products with descriptions, paged with Previous and Next shown only when a page exists.
- Product listing: the product's items with description, price and Add to Cart, paged.
- Item detail: item image, List Price, Your Price and Add to Cart.
- Search results: "Items matching any of:" the keywords, then matching items with description, price and Add to Cart, paged; "No results were found for your search." when the query is empty or nothing matches.
- Shopping cart: one row per line with item link, Remove, editable quantity and price; Update Cart, subtotal and Check Out; "Your Shopping Cart is Empty." when empty.
- Sign in: returning-customer form (user name, password, Remember My User Name) beside a new-account form (user name, password, repeated password).
- Sign-in error: the user name and password were not found; try again.
- User creation error: the chosen user name is in use.
- Create account and Edit account: contact information, credit card and profile preferences.
- Account overview: read-only contact, card and profile details with a link to edit.
- Checkout (order information): Billing Information and Shipping Information sections pre-filled from the account, and Submit.
- Order confirmation: "Your Order is Complete", the order id and the address the confirmation e-mail goes to.
- Empty-cart order error: the cart was empty and no order was placed.
- Signed out: "You are signed out" with a link to sign in again.
- General error page.

Administration:

- Administrator sign-in and sign-in error.
- Administrator landing page: explains what the administrator can do and offers two controls, launch the order-management workspace and log out.
- Admin order review: Process Pending Orders (ID, User ID, Date, Amount, Status; sortable; status colour cues; Approve, Deny, Commit) and View Non-Pending Orders (same columns, read-only), with Refresh and a warning when uncommitted decisions would be discarded.
- Admin sales reporting: pie chart of revenue share by category and bar chart of volume by category, each with Start Date, End Date and Get Data.

Supplier:

- Supplier sign-in and sign-in error.
- Supplier home: Display Inventory and Logout.
- Supplier inventory: every stock record with its item id, current quantity, a New Quantity field and an Update tick box, and one Submit; a "no items in inventory" state when there are none.
- Inventory update confirmation: the update succeeded, with Display Inventory and Logout.

E-mail (not screens, but customer-visible):

- Approval decision e-mail, shipment e-mail and order-completed e-mail.

## Constraints and assumptions

Constraints:

1. The replacement is built on the project's pinned stack: one repository running a Vite React SPA with a Nitro (H3) server, TypeScript strict, file-based routing on both sides, SQLite through Drizzle with migrations in `drizzle/`, Tailwind CSS-first styling, and Vitest and Playwright tests. The stack is described in ARCHITECTURE.md.
2. The four legacy applications become one deployable application. Durable, asynchronous hand-offs replace the message queues. The admin rich client becomes SPA pages.
3. Order placement must return to the shopper without waiting on approval, fulfilment or e-mail. Downstream work must survive a restart.
4. Every behaviour built must trace to a requirement in the capability specs under `openspec/changes/`. Where a spec and this PRD disagree, the spec is the build input until the divergence is resolved.
5. Money must not be computed in binary floating point. The legacy float and double arithmetic is not carried over.
6. Card numbers must not be stored or shown in full.

Assumptions:

1. One supplier fills every order.
2. Customers accept e-mail as the only channel for order status.
3. Recorded inventory is kept accurate by staff. Nothing reconciles it against physical stock.
4. Nothing is reserved at order time, so two orders can compete for the same stock. This is carried over unless decided otherwise.
5. The catalogue is small: five categories (Birds, Cats, Dogs, Fish, Reptiles) seeded as reference data.
6. The deployed values of the legacy e-mail switches are redacted in the source, so whether each notification was on in production is unknown. The replacement ships them on.

## Open questions

1. **Operator request about the "Landing page" scenario.** The operator asked: "Are you able to edit the scenario for Requirement: Landing page". The matching requirement is "Administrator landing page" in `openspec/changes/sx-order-approval/specs/order-approval/spec.md`, with three scenarios: "Landing page displayed", "Launch control used" and "Logout control used". It can be edited, but the request does not say what the new scenario should state, and this PRD pass changes no spec. The operator needs to say which scenario to change and what it should say. The Screens section describes the landing page as the spec does now.
2. **Auto-approval thresholds.** The documents say one $500 rule. The code auto-approves en_US under 500 and ja_JP under 50000 (yen), and never auto-approves zh_CN. This PRD takes the code's per-locale rule as current, made configurable. Should zh_CN get a threshold?
3. **Order statuses.** The documents list four statuses. The code and spec have five, including SHIPPED_PART. This PRD takes five as current. Should a waiting-on-stock order also get a distinct status?
4. **Price charged.** The mockups price the cart and order at "Your Price" (unit cost). The code charges the list price. This PRD takes no side: which price is charged must be decided before shopping-cart and checkout are built.
5. **Card on an order.** The documents say the order uses the account's card. The code attaches a hard-coded demo card. This PRD takes the documents' side (the account's card on file) as current, pending confirmation.
6. **Checkout validation.** The documents require every field except address line 2. The code leaves e-mail and country unchecked. It also crashes with a server error when a required field is missing, where the manual says the form is shown again with the problem marked. This PRD takes the documented behaviour as current. Is e-mail required?
7. **Billing and shipping on the stored order.** The documents say the order keeps both addresses. The code keeps only one contact and reports it as both. This PRD takes the documents' side. Store both?
8. **Customer data sent to the supplier.** The documents say the supplier sees no customer data. The code sends the ship-to name, address, e-mail and phone. This PRD takes the code's side as current, since the supplier ships the order. Confirm, and settle the related open choice in `architecture/rebuild-guidance.md`: is the supplier an external partner exchanging XML documents, or in-process?
9. **Per-locale prices.** The documents say one price for all locales. The code stores a price per locale. This PRD takes the code's side, consistent with the ja_JP yen threshold.
10. **Re-adding an item to the cart.** The documents say its quantity increments. The code resets it to 1. This PRD takes the documents' side (increment) as the better behaviour. Confirm.
11. **Sales reports.** The documents say the bar chart counts orders and that denials reduce the figures. The code sums line quantities over orders in every status, denied included. Which should the replacement report?
12. **Admin data endpoint access.** The documents require authentication on every admin screen. The legacy order-data endpoint checks only that a session exists. This PRD requires the administrator role on every admin API.
13. **Minor divergences.** Other disagreements are listed in `design/prd/divergences.yaml` and this PRD follows the side stated in each case:
    - The demo password is pre-filled at sign-in; this PRD does not pre-fill it.
    - Sign-out goes to a "signed out" page, not Home; this PRD follows the code.
    - Search matches product name, category id and item description; this PRD follows the code.
    - The admin client accepts report dates only as MM/dd/yyyy; this PRD makes date entry locale-aware.
    - The checkout country list includes China; this PRD follows the code.
14. **Legacy WAF locale page.** The localization capability carries a locale selection screen from the legacy WAF demo that offers German. The storefront does not support German. This PRD treats it as evidence of the language switcher and does not list it as a screen. Drop the German option?
15. **Capability boundaries.** This PRD keeps the manifest's eleven capabilities unchanged: none merged, split, dropped or added. Admin sales reporting stays inside order-approval, as the manifest files it.

## Sources

Sources for each section are listed in `design/prd/sources.yaml`. Every document-versus-code disagreement is in `design/prd/divergences.yaml`.
