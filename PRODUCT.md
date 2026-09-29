# React Pet Store 5 Migration

_PRD v10 · approved 2026-09-27 · by sweeho@gmail.com. Published from the Design Workbench — edit it there, not here._

## Summary

React Pet Store 5 replaces Java Pet Store 1.3.2, an online pet shop, with a single TypeScript application: a React single-page storefront and back office served together with a Nitro API over one SQLite database. It keeps what the legacy system does for its three kinds of user. Shoppers browse, search, fill a cart and check out in English, Japanese or Chinese. Administrators approve or deny high-value orders and see sales by category. Supplier staff keep stock levels current, which releases waiting orders. Orders then move through approval, supplier fulfilment, invoicing and e-mail notification without anyone re-keying them.

The replacement is specified from the legacy code, not from the legacy design. Eleven capabilities, extracted from the code and listed in the Capability map, define the build. Where the legacy documents described something the code does not do, a reviewer has decided which side is right, and this PRD states the decided side. The decided behaviours are listed under Constraints and assumptions.

## Context

The legacy system is Sun's Java Pet Store 1.3.2 J2EE blueprint (`legacy-source/petstore1.3.2/`). It is four separately deployed applications that talk over durable message queues:

- a customer storefront;
- an Order Processing Centre (OPC) with no user interface, which takes orders, applies approval rules, tracks order status and sends customer e-mail;
- an administrator console, which is a small web page that launches a desktop client;
- a supplier application that holds inventory, fills orders and issues invoices.

An order goes from the storefront to the OPC. The OPC auto-approves it or leaves it pending for an administrator, then sends a purchase order to the supplier. The supplier ships the lines it has stock for and sends invoices back. The OPC marks the order partly shipped or completed and e-mails the customer at each decision, shipment and completion.

Two legacy documents describe the system: a user manual and a product requirements document, both reconstructed in 2026. A set of screen mockups goes with them. They broadly match the code but disagreed with it in nineteen places. Examples are the approval thresholds, the number of order statuses, how the cart is priced, which card an order is paid with, and what the supplier learns about customers. A reviewer has decided all nineteen. The code's side won seventeen, and the documents' side won two: re-adding an item increments its quantity, and an order is paid with the card on the customer's account. No undecided disagreement remains.

The replacement collapses the four applications into one monolith on the project's pinned stack. The legacy message queues, XML-over-HTTP admin protocol and Java Web Start client are implementation details. They are not requirements. The asynchronous, durable hand-offs they provided are requirements.

## Goals

1. A visitor can find a pet, put it in a cart and check out, signing in only when checkout or the account page requires it.
2. An order is approved automatically when its locale is en_US and its total is under 500, or its locale is ja_JP and its total is under 50000 (in that locale's own prices). Every other order, including every zh_CN order, waits for an administrator.
3. An approved order completes automatically once the supplier has stock for every line. Partial shipments are recorded and reported.
4. The customer is e-mailed when an order is approved or denied, when part of it ships and when it completes, in the language of the order.
5. The storefront, including catalogue content and prices, is available in English (en_US), Japanese (ja_JP) and Simplified Chinese (zh_CN).
6. Administrators can review pending orders in batches, commit decisions together, and see sales revenue and ordered quantity by category over a date range.
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

**Shopper submits checkout with a required field blank**

1. Checkout (order information)
2. General error page

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
- Item detail: item image, List Price, Your Price and Add to Cart. The cart and the order are charged at the List Price.
- Search results: "Items matching any of:" the keywords, then matching items with description, price and Add to Cart, paged; "No results were found for your search." when the query is empty or nothing matches.
- Shopping cart: one row per line with item link, Remove, editable quantity and the item's list price; Update Cart, subtotal and Check Out; "Your Shopping Cart is Empty." when empty.
- Sign in: returning-customer form (user name, password, Remember My User Name) beside a new-account form (user name, password, repeated password). With a remembered user name, that name is pre-filled and the password is empty; without one, the demo user name and password are pre-filled.
- Sign-in error: the user name and password were not found; try again.
- User creation error: the chosen user name is in use.
- Create account and Edit account: contact information, credit card and profile preferences.
- Account overview: read-only contact, card and profile details with a link to edit.
- Checkout (order information): Billing Information and Shipping Information sections pre-filled from the account, each with a country choice of United States, Canada, Japan and China; the card on the account that will be charged; and Submit.
- Order confirmation: "Your Order is Complete", the order id and the address the confirmation e-mail goes to.
- Empty-cart order error: the cart was empty and no order was placed.
- Signed out: "You are signed out" with a link to sign in again.
- General error page, also shown when checkout is submitted with a required field blank.

Administration:

- Administrator sign-in and sign-in error.
- Administrator landing page: explains what the administrator can do and offers two controls, launch the order-management workspace and log out.
- Admin order review: Process Pending Orders (ID, User ID, Date, Amount, Status; sortable; status colour cues; Approve, Deny, Commit) and View Non-Pending Orders (same columns, read-only), with Refresh and a warning when uncommitted decisions would be discarded.
- Admin sales reporting: pie chart of revenue share by category and bar chart of ordered quantity by category, counting orders in every status, each with Start Date and End Date entered as MM/dd/yyyy and Get Data.

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
4. Every behaviour built must trace to a requirement in the capability specs under `openspec/changes/`. Where a spec contradicts a decided behaviour below, the decided behaviour wins and the spec is corrected (see Open questions).
5. Money must not be computed in binary floating point. The legacy float and double arithmetic is not carried over.
6. Card numbers must not be stored or shown in full.

Decided behaviours (a reviewer settled each disagreement between the legacy documents and the code):

1. Auto-approval: en_US orders under 500 and ja_JP orders under 50000 are approved automatically. zh_CN orders are never approved automatically, whatever their total.
2. An order has five statuses: PENDING, APPROVED, DENIED, SHIPPED_PART and COMPLETED. The lifecycle is PENDING, APPROVED, SHIPPED_PART, COMPLETED, or PENDING, DENIED.
3. Adding an item already in the cart increments that line's quantity. It does not add a second line.
4. The cart lines, the cart subtotal and the placed order are priced at the item's list price, not at "Your Price".
5. An order is paid with the card on the customer's account. The card is not re-entered at checkout.
6. A checkout submitted with a required field blank places no order, and the shopper sees the general error page, not a field-level message.
7. At checkout, last name, first name, street line 1, city, state or province, postal code and telephone are required. Street line 2 and e-mail are optional, and country is not checked.
8. An order stores one contact, taken from the shipping information. Read back, that contact serves as both the billing and the shipping contact.
9. The supplier receives the ship-to name, street line 1, city, state, country, postal code, e-mail and telephone with every supplier order.
10. Each locale carries its own item prices. There is no single price formatted three ways, and no conversion.
11. The admin order-data service requires an existing signed-in session. Only the admin console itself is restricted to the administrator role.
12. A supplier stock update re-attempts the supplier's own pending orders and sends an invoice for each one that ships. The OPC receives invoices, not stock changes.
13. The sales "order count" chart sums line quantities per category.
14. Sales reports include orders in every status between the two dates, denied and pending included.
15. Report dates are entered as MM/dd/yyyy in every locale.
16. When no remembered user name exists, the sign-in form is pre-filled with the demo user name and password.
17. Signing out shows a "You are signed out" page with a link to sign in again. It keeps the language and starts an empty cart.
18. Search matches any keyword, as a case-insensitive substring, against the localized product name, the category id and the item description.
19. The checkout country choices are United States, Canada, Japan and China.

Assumptions:

1. One supplier fills every order.
2. Customers accept e-mail as the only channel for order status.
3. Recorded inventory is kept accurate by staff. Nothing reconciles it against physical stock.
4. Nothing is reserved at order time, so two orders can compete for the same stock. This is carried over unless decided otherwise.
5. The catalogue is small: five categories (Birds, Cats, Dogs, Fish, Reptiles) seeded as reference data.
6. The deployed values of the legacy e-mail switches are redacted in the source, so whether each notification was on in production is unknown. The replacement ships them on.

## Open questions

1. **Operator request about the "Landing page" scenario.** The operator asked: "Are you able to edit the scenario for Requirement: Landing page". The matching requirement is "Administrator landing page" in `openspec/changes/sx-order-approval/specs/order-approval/spec.md`, with three scenarios: "Landing page displayed", "Launch control used" and "Logout control used". It can be edited, but the request does not say what the new scenario should state, and this PRD pass changes no spec. The operator needs to say which scenario to change and what it should say. The Screens section describes the landing page as the spec does now.
2. **Specs that contradict decided behaviours.** Three specs need correcting before their capabilities are built:
   - The shopping-cart requirement "Add item to cart" says re-adding an item resets its quantity to 1 and "MUST NOT increment". The decision is that the quantity increments.
   - The checkout scenario "A required shipping field is blank" says the missing field is reported. The decision is that the shopper sees the general error page.
   - The checkout requirement "Credit card attached to every order" requires only that some card is attached. The decision is that it is the card on the customer's account.
3. **Supplier boundary.** `architecture/rebuild-guidance.md` records a choice between two options. Either the supplier is an external partner exchanging the legacy XML documents (b2b-document-exchange design), or it is in-process with no wire compatibility (order-fulfillment design). As built, it is in-process but exchanges the legacy XML documents: supplier orders and invoices cross the outbox in the partner formats (order-fulfillment sprint planning, SD-4). Moving to internal message shapes would be a local change in `lib/b2b/exchange/`. The operator still needs to confirm this as the rule.
4. **Legacy WAF locale page.** The localization capability carries a locale selection screen from the legacy WAF demo that offers German. The storefront does not support German. This PRD treats it as evidence of the language switcher and does not list it as a screen. Drop the German option?
5. **Capability boundaries.** This PRD keeps the manifest's eleven capabilities unchanged: none merged, split, dropped or added. Admin sales reporting stays inside order-approval, as the manifest files it.

## Sources

Sources for each section are listed in `design/prd/sources.yaml`. No undecided document-versus-code disagreement remains, so `design/prd/divergences.yaml` is empty.
