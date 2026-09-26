# Rebuild guidance: Java Pet Store 1.3.2 → pinned stack

Produced by spec extraction SX-0001 (stage emit-crosscutting). This file tells an agent building one of the 11 capabilities in `build/manifest.yaml` which artifacts to trust, what order to build in, and which rules cut across capabilities. The requirements themselves live in each capability's delta spec, `openspec/changes/sx-<capability>/specs/<capability>/spec.md`, and this file does not restate them.

## 1. Sources of truth, in priority order

1. **The capability delta spec** (`openspec/changes/sx-<capability>/specs/<capability>/spec.md`). This is what to build. When anything else disagrees with it, the delta spec wins.
2. **The capability design** (`openspec/changes/sx-<capability>/design.md`). It covers the target-stack mapping, open questions (OQ/Q/R/F codes) and legacy traces. An open question in a design is a decision nobody has made yet. Do not settle it silently in code; raise it.
3. **This file**, for cross-capability rules and build order.
4. **Legacy evidence**. Read it to understand what exists. It is not a design:
   - `api/openapi.yaml` describes the legacy HTTP surface: HTML front-controller URLs (`*.screen`, `*.do`), servlet endpoints and the JMS channels. The rebuild's API is Nitro/H3 JSON routes under `routes/api/`, shaped per capability design. Do not reproduce `*.do` URLs or XML-over-POST.
   - `architecture/schema.sql` and `architecture/erd.mermaid` describe the legacy tables across three datasources, including container-generated CMP tables with `__PMPrimaryKey` columns. Do not copy them into `db/`. Each capability design specifies its own Drizzle tables.
   - `legacy-source/petstore1.3.2/` is the application itself. `legacy-analysis/ir/_passes/` holds the extracted records every requirement traces to (`evidence.irRefs` in the manifest).

None of the 11 capabilities has been reviewed by a named SME (`reviewedBy: null` throughout the manifest). Treat every `low`-confidence or `disputed` point in a design as unconfirmed.

## 2. Build order

`build/manifest.yaml` `order` / `dependsOn`:

| Order | Capability             | Depends on                                                      |
| ----- | ---------------------- | --------------------------------------------------------------- |
| 1     | localization           | none                                                            |
| 2     | b2b-document-exchange  | none                                                            |
| 3     | sign-on                | localization                                                    |
| 4     | catalog-browsing       | localization                                                    |
| 5     | customer-account       | sign-on, catalog-browsing, localization                         |
| 6     | shopping-cart          | catalog-browsing, localization                                  |
| 7     | checkout               | sign-on, customer-account, shopping-cart, b2b-document-exchange |
| 8     | order-approval         | sign-on, checkout                                               |
| 9     | order-fulfillment      | b2b-document-exchange, checkout, order-approval                 |
| 10    | supplier-inventory     | sign-on, order-fulfillment                                      |
| 11    | customer-notifications | localization, order-approval, order-fulfillment                 |

The proposals declare two mutual dependencies. The manifest breaks each one in the direction the data flows:

- **shopping-cart ↔ checkout.** Checkout reads the cart and empties it after an order is placed, so checkout depends on the cart. The cart's "Empty cart after order placement" requirement is the cart exposing an empty operation. It does not need checkout to exist.
- **order-fulfillment ↔ supplier-inventory.** Fulfilment owns supplier orders, shipment and invoicing, and it reads and decrements stock. Supplier-inventory owns the stock table and its edit screen, and a stock update calls fulfilment's "process pending supplier orders". Fulfilment is built first, together with the stock table it reads. Supplier-inventory then adds the edit surface and the update trigger. If the stock table is created in fulfilment's migration, supplier-inventory must not create it again.
- order-approval and order-fulfillment both say they "depend on" the notification capability. In both cases it is a consumer of their outcomes, so notifications is built last and hooks into the events they already emit.

## 3. Cross-cutting rules for every capability

### 3.1 One application, one database

The legacy system is four deployables (storefront, order processing centre, supplier, admin) over three datasources (`jdbc/petstore/PetStoreDB`, `jdbc/opc/OPCDB`, `jdbc/supplier/SupplierDB`). The rebuild is one Vite SPA plus one Nitro server over one SQLite database through Drizzle (`db/`, migrations in `drizzle/`).

- The legacy ContactInfo, Address, CreditCard and LineItem tables each exist once per datasource. Model them per owning aggregate as the designs say: customer contact, order contact, supplier-order contact. Do not share rows across aggregates.
- Cross-datasource links in the legacy system are value-only. Examples are order `poUserId` to customer, line `itemId` to catalog item, and supplier `poId` to order `poId`. Whether the rebuild adds foreign keys for them is a per-capability design choice. Record it where it is made.
- Every schema change runs `db-generate`, and the generated migration in `drizzle/` is committed with it.

### 3.2 Asynchronous hops

Legacy order processing is entirely JMS-driven. There are 5 destinations (`api/openapi.yaml` `x-legacy-async-channels`). Five designs each propose a replacement:

- checkout: order outbox
- order-approval: D2 durable approval-decision job
- order-fulfillment: D3 SQLite outbox and in-process dispatcher
- b2b-document-exchange: D1 outbox with per-consumer delivery state
- customer-notifications: D1 mail outbox

**Recommendation:** build one outbox and dispatcher mechanism once, when checkout (order 7) first needs it, and reuse it in the later capabilities. It should provide:

- per-consumer delivery state, for invoice fan-out to fulfilment and to mail
- a write in the same `db.transaction()` as the state change
- retry for a failed handler

The legacy system had no retry cap or dead-letter state. Choosing one is a new decision, and it goes in ARCHITECTURE.md `## Key Decisions`. This is a recommendation. The Planning agent owns ARCHITECTURE.md and decides.

### 3.3 Conflict to settle before building order-fulfillment

The two designs disagree on the wire format:

- `b2b-document-exchange` (design Goals) keeps the XML formats byte-compatible at the element and attribute level, so an existing partner can exchange with the rebuild unchanged.
- `order-fulfillment` (design Non-Goals) states: "Wire-compatible XML documents or JMS. The rebuild is a single monolith."

Both cannot be the rebuild's rule for the order-centre ↔ supplier hop. A human must decide one of two options:

- **(a)** The supplier is an external partner. XML documents cross that boundary, and fulfilment reads and writes them through the b2b module.
- **(b)** The supplier is in-process. The XML formats are kept only for the partner-facing edge, if one exists.

Until then, build fulfilment against an internal message shape and keep the b2b serializers separate, so either answer is a local change.

### 3.4 Money

The legacy system stores money in three ways:

- `decimal(10,2)` in the catalog
- `REAL` (single-precision float) on orders and lines
- `double` in the cart subtotal

The order total and the cart subtotal therefore use different arithmetic (discovery F2). No capability should carry floats forward. Store integer minor units, and format per locale at display time. The rounding rule for totals is an open question in the shopping-cart (OQ-2) and checkout designs. Resolve it once and apply it in both.

### 3.5 Sensitive data

The legacy system stores passwords in plain text (`UserEJBTable.password`), and `CreateUserServlet` logs them. It also stores and displays full card numbers (`CreditCardEJBTable.cardNumber`, on customers and on orders). Checkout attaches a hard-coded card (checkout design). None of this is a requirement:

- Hash passwords.
- Do not log credentials.
- Card storage and masking wait on customer-account design Q1.

### 3.6 Access control

- **Storefront.** A signed-on gate (the legacy SignOnFilter) protects only the listed pages: account, account update, order information and sign-on welcome. Catalog, search and cart stay anonymous. Implement it as Nitro middleware plus SPA route guards, per the sign-on design.
- **Admin and supplier.** These surfaces require the administrator role. The legacy admin XML endpoint `/ApplRequestProcessor` sat outside that constraint and only checked that a session existed (discovery F4). Every rebuild admin route must require the role.
- **Seeding.** The legacy sample-data loaders at `/Populate` (storefront and supplier) are unauthenticated (discovery F7). Whether the rebuild keeps a seeding route is open: catalog-browsing Q6 and the supplier-inventory design.

### 3.7 Locale

Localization (order 1) owns the locale model: the supported locales en_US, ja_JP and zh_CN, and the default en_US. Other capabilities must not invent their own rules. Catalog detail rows, cart, profile, order and email content are keyed by locale, and prices are per-locale rows with no conversion. Auto-approval thresholds are per locale (order-approval D1). zh_CN is never auto-approved in the legacy system, and that needs a product decision.

### 3.8 Screens

`canvas.screens` in the manifest is the complete list of extracted screens, 23 in total across 9 capabilities. Neither b2b-document-exchange nor order-fulfillment has a screen. The legacy admin console was a Swing Web Start client. In the rebuild its screens become SPA pages. The localization screen record comes from the WAF demo application and offers German, which the storefront does not support. Treat it as evidence of a locale switcher, not as a page to copy.

## 4. Discovery findings every builder should know

These come from `legacy-analysis/discovery/report.md` §4. Each one is handled in the relevant design.

| Code | Finding                                                                                                   | Owning capability                    |
| ---- | --------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| F1   | Auto-approval thresholds are bare literals (US < 500, JP < 50000, all others never)                       | order-approval                       |
| F2   | Order total summed in float, cart subtotal in double                                                      | checkout, shopping-cart              |
| F3   | Only one order contact is stored, so shipping reads back as billing                                       | order-fulfillment, checkout          |
| F4   | Admin XML endpoint outside the administrator security constraint                                          | order-approval, sign-on              |
| F5   | Dead or demo code (WAF demo war, superseded ChangeLocaleEJBAction); rules found only there are `disputed` | localization, sign-on                |
| F6   | Two SQL dialects (cloudscape/oracle); in the DDL they differ only in char vs varchar                      | catalog-browsing                     |
| F7   | `/Populate` sample-data loaders are reachable and unauthenticated                                         | catalog-browsing, supplier-inventory |

## 5. Stack reminders specific to this rebuild

- Browser code goes under `src/` (pages in `src/pages/`, file-based via vite-plugin-pages). Server code goes under `routes/api/` (Nitro file-based) and server-only modules outside `src/`. The legacy EJB and MDB logic is server-side and never belongs in the SPA bundle.
- Route tests live under `routes/**/*.test.ts` so they run in the Vitest `server` project, because `bun:sqlite` does not resolve under jsdom.
- Tailwind is CSS-first, and a `tailwind.config.*` file is a defect. At the time of this extraction a `tailwind.config.ts` exists at the repository root. That is outside extraction scope, and it is flagged here so the first build ticket does not treat it as convention.
