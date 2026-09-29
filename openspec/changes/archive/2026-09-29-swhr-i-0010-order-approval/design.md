## Context

Source: 36 ingested IR records (63 pass records across two passes) under `capability_key: order-approval`, drawn from `docs/using.html`, `src/apps/admin` (landing JSP, request-processor servlet, Swing Web Start client), `src/apps/opc` (order-processing MDBs and the admin facade EJB), and the `asyncsender`, `processmanager`, `purchaseorder` and `xmldocuments` components. Paths below are relative to `legacy-source/petstore1.3.2/`.

Legacy flow:

1. `PurchaseOrderMDB` (`src/apps/opc/.../ejb/PurchaseOrderMDB.java:151-191`) persists an incoming order and calls `canIApprove()`. If it returns true, it builds an `OrderApproval` containing one APPROVED `ChangedOrder` and sends it to `jms/opc/OrderApprovalQueue`; otherwise nothing is sent and the order sits in PENDING.
2. The administrator signs in (`src/apps/admin/src/docroot/WEB-INF/web.xml:75-101`, role `administrator`), sees `index.jsp`, and launches the Swing client via Java Web Start.
3. The client talks XML-over-HTTP POST to `ApplRequestProcessor` (`src/apps/admin/.../web/ApplRequestProcessor.java:122-326`) with request types GETORDERS, UPDATESTATUS, REVENUE, ORDERS. That servlet calls the remote `OPCAdminFacadeEJB` for reads, and for UPDATESTATUS serialises an `OrderApproval` document and sends it through `AsyncSenderEJB`, whose queue reference the admin app binds to `jms/opc/OrderApprovalQueue` (`src/apps/admin/src/sun-j2ee-ri.xml:95-98`). It replies SUCCESS as soon as the message is sent.
4. `OrderApprovalMDB` (`src/apps/opc/.../ejb/OrderApprovalMDB.java:185-240`) processes each `ChangedOrder`, skips any whose current status is not PENDING, updates status in the process manager, builds a supplier PO for APPROVED orders, and `OrderApprovalTD` sends each PO to `jms/supplier/PurchaseOrderQueue` and one batched message to the mail-approval queue.

Client structure: `PetStoreAdminClient` (frame, refresh on start), `DataSource` (table models, `RefreshAction`, `commit()`, `ChartModel`, `fatalServerError`), `OrdersApprovePanel` / `OrdersViewPanel`, `PieChartPanel` / `BarChartPanel`, `HttpPostPetStoreProxy` (wire format). All visible strings are in `src/apps/admin/src/client/resources/petstore.properties`.

## Goals / Non-Goals

**Goals**

- Rebuild the approval decision, review workflow, decision delivery and administrator reports on the pinned stack (Vite React SPA + Nitro/H3 + SQLite/Drizzle).
- Replace the Swing Web Start client with SPA pages that honour the screen requirements in `specs/order-approval/spec.md`.

**Non-Goals**

- Administrator authentication itself (owned by `sign-on`).
- Supplier fulfilment and the content of customer emails (owned by the fulfilment and notification capabilities); this change only emits the triggers.
- Reproducing JMS, XML/DTD wire formats or Java Web Start.

## Decisions

- **D1 Threshold follows the code, not the guide.** `using.html:201-240` states one $500 threshold and is silent on exactly $500. `PurchaseOrderMDB.canIApprove()` (lines 183-191) uses strict `<` against 500 for `Locale.US`, 50000 for `Locale.JAPAN`, and returns false for every other locale including zh_CN, which the storefront otherwise supports. The spec states the code behaviour. Confidence is low (bare literals, no configuration). Recommend making the thresholds per-locale configuration in the rebuild; whether zh_CN should ever auto-approve needs a product decision.
- **D2 Queue replaced by a durable job.** JMS decoupling becomes a persisted "approval decision" record processed by a Nitro task or in-process worker; the success-on-enqueue semantics are preserved (the API returns once decisions are persisted, before they are applied).
- **D3 Idempotency guard kept.** The PENDING-only guard in `OrderApprovalMDB` is what makes duplicate or late decisions safe (an auto-approved order later denied by an admin is ignored). It must stay a server-side check inside the same transaction as the status update.
- **D4 Approve and deny batches.** The client sends APPROVED rows then DENIED rows as two `UPDATESTATUS` calls (`DataSource.java:422-498`). The rebuild MAY send one request carrying both, as long as the two outcome groups are distinguishable and an empty commit sends nothing.
- **D5 Wire document validation.** The DTD (`src/components/xmldocuments/src/rsrc/schemas/OrderApproval.dtd:38-45`) requires at least one order, each with id then status. In the rebuild this becomes request-body schema validation on the decisions endpoint; the "skip entries lacking id or status" rule in `ApplRequestProcessor.updateOrders` (lines 212-224) applies before the document is built, so an all-invalid submission produces nothing to queue.
- **D6 Fatal error behaviour.** The legacy client calls `System.exit(1)` after the "Fatal Error!" dialog. The spec keeps "end the session"; in a SPA that should mean showing the error and blocking further actions until reload, not closing the tab.

## Risks / Trade-offs

- **R1 Date format mismatch.** `OPCAdminFacadeEJB.getOrdersByStatus` formats dates as `month/day/year` without padding (`getMonth()+1`, `getDate()`, `getYear()+1900`), while the client parses with `MM/dd/yyyy` (lenient `SimpleDateFormat`, so it works). The spec follows the server output (M/D/YYYY). Flag for a human if a padded format is preferred.
- **R2 Reports ignore status.** `getChartInfo` (`OPCAdminFacadeEJB.java:159-256`) counts every order in the window, including DENIED ones, so "revenue" includes revenue that was never taken. Stated as-is; likely unintended.
- **R3 "Order count" counts quantities.** The ORDERS report sums line quantities, not orders, although the chart describes it as "total # of sales per category". The spec states the arithmetic; the label is legacy copy.
- **R4 Revenue precision.** Revenue is summed in single-precision `float`. The rebuild should use integer minor units or decimal arithmetic; totals may differ from the legacy by rounding.
- **R5 Legacy default date range** (1/1/2001 to 12/31/2002, `DataSource.java:522-531`) is a demo artefact; stated as a requirement (low confidence). A rolling default is likely more useful.
- **R6 Success before application.** The administrator sees success before orders change; a refresh immediately after commit may still show orders as pending.

## Legacy screen notes

- Landing page: `src/apps/admin/src/docroot/index.jsp:61-82`; two POST forms to `AdminRequestProcessor` with `currentScreen=manageorders` and `currentScreen=logout`.
- Pending view: `OrdersApprovePanel.java:80-171` (status editor combo, Approve/Deny apply to `getSelectedRows()`, `TableSorter` header sorting, colour renderer); editability in `DataSource.java:500-507` (column 4 only).
- Non-pending view: `OrdersViewPanel.java:47-77`, `DataSource.java:291-305, 402-407`.
- Sales view: `PieChartPanel.java:111-210`, `BarChartPanel.java:102-124`; pie/bar selector strings `SalesPanelComboBox.*`.
- Busy state: `DISABLE_ACTIONS` / `ENABLE_ACTIONS` property events (`PetStoreAdminClient.java:307-319`, `OrdersApprovePanel.java:191-199`).

Screen records to requirement mapping (10 pass records, 7 requirements): landing page (admin b SCREEN-0001); client workspace (docs b SCREEN-0001, docs a SCR-0003 two-pane part); pending display (admin a SCR-0008); pending decisions (admin b SCREEN-0006); non-pending view (admin a SCR-0009, admin b SCREEN-0005, docs c SCREEN-0001); sales charts (admin b SCREEN-0016); order-row display (opc b SCREEN-0001).

## Migration Plan

Legacy statuses map one-to-one to the new status column. Orders PENDING at cut-over remain PENDING and appear in the new pending view; no in-flight queue messages should exist if the legacy queues are drained before cut-over.

## Open Questions

- **Q1** Should zh_CN (and any future locale) have an auto-approval threshold? (D1)
- **Q2** Should reports exclude DENIED orders? (R2)
- **Q3** Should the order-count report count orders rather than quantities? (R3)

## Sprint planning — SWHR-S-0012

Everything above this heading was imported with the change and is unchanged. This section records what the rebuild already has, the decisions that bind the six tickets, and where the spec and this repository disagree. Designs: `artifacts/SWHR-S-0012/design/` (index `MANIFEST.md`).

### Codebase findings

- **Orders already exist.** Checkout (swhr-i-0009) stores each order through the `order-intake` consumer (`lib/orders/intake.ts`, `lib/orders/store.ts`). `purchaseOrders` already has `status` NOT NULL DEFAULT `'PENDING'` with a CHECK over PENDING, APPROVED, DENIED, SHIPPED_PART and COMPLETED (PRD decided behaviour 2), `totalValue` in integer minor units, `orderDate` and `locale`. `orderLines` holds `categoryId`, `itemId`, `quantity` and `unitPrice` in minor units. Nothing sets a status other than PENDING yet.
- **One outbox.** `lib/messaging/outbox.ts` has fixed channels and subscribers; `enqueue(tx, channel, payload)` joins the caller's transaction; the dispatcher runs each handler's commit in one `db.transaction` and retries. `plugins/order-intake.ts` shows the registration pattern. A delivery for a subscriber nobody has registered stays pending, which is how `supplier.purchase-order` works today.
- **Supplier purchase orders** are sent with `sendSupplierPurchaseOrders(tx, SupplierOrder[])` (`lib/b2b/exchange/supplierChannel.ts`). `SupplierOrder` is `{ orderId, orderDate, shippingInfo: ContactInfo, lineItems: LineItem[] }` with decimal-string unit prices. The supplier consumer is not registered yet (order-fulfillment).
- **Money.** `lib/orders/money.ts` converts minor units to and from exact decimal strings: 2 fraction digits for en_US and zh_CN, 0 for ja_JP.
- **XML reading.** `lib/b2b/xml/read.ts` has `expectRoot` and `ChildReader`, whose errors name the element (`OrderStatus element expected.`, `OrderStatus element: content expected.`).
- **Administration today** (sign-on, swhr-i-0005): `/admin` is a public landing page linking to `/admin/signin`; `/admin/console` is the role-gated console with "Manage orders" (calls `GET /api/admin/launch`, SWHR-R-0081) and "Sign out". `GET /api/admin/orders` lists **supplier** orders behind an admin-realm session (cookie or `Authorization: Session <id>`), answering 401 "Session Timed Out; Please exit and login as admin from the login page" (SWHR-R-0080). Admin copy lives in `src/i18n/admin/{en,de}.ts`. `e2e/sign-on.spec.ts` asserts the console heading "Administration console".
- **UI.** No dialog, table or chart component exists; `@headlessui/react` is a dependency. `src/index.css` already carries `chart-1`…`chart-10` tokens. DESIGN.md has no status-colour role.
- **Catalogue.** Categories are ids (`FISH`, `DOGS`, …) with per-locale names in `category_details`; every seeded category has an en_US row.

### Planning decisions

- **P1 — Thresholds (SWHR-T-0119, 1.3).** `lib/orders/approvalPolicy.ts` exports `AUTO_APPROVAL_THRESHOLDS: Record<LocaleId, number | null>` in minor units: `en_US: 50000` (500.00), `ja_JP: 50000` (¥50000), `zh_CN: null`. The configuration is this one table. SWHR-T-0120 adds `shouldAutoApprove(locale: string, totalMinor: number): boolean` to the same file: true only when the threshold is non-null and `totalMinor < threshold`. An unknown locale is never auto-approved.
- **P2 — Approval document (SWHR-T-0119, 1.2).** `lib/b2b/documents/orderApproval.ts` follows the purchase-order and supplier-order documents in the same directory. It exports:
  - `type ApprovalStatus = "APPROVED" | "DENIED"` and `interface ApprovalEntry { orderId: string; status: ApprovalStatus }`.
  - `ORDER_APPROVAL_PUBLIC_ID = "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD OrderApproval 1.1//EN"`.
  - `writeOrderApproval(entries: ApprovalEntry[]): string` writes the root `OrderApproval` with one `Order` per entry, holding `OrderId` then `OrderStatus`, and always declares the DOCTYPE. It throws on an empty list.
  - `readOrderApproval(xml: string, opts?: ReadOptions): Promise<ApprovalEntry[]>`:
    - Parsing comes first.
    - When `isValidationEnabled("orderApproval")` holds (the existing `B2B_VALIDATE_ORDER_APPROVAL` switch), it runs `checkDocumentType` and then `validateDocument`, logging violations and continuing, exactly as `readPurchaseOrder` does.
    - Then it ALWAYS enforces the content model with `expectRoot` and `ChildReader`: root `OrderApproval`, at least one `Order`, and each `Order` exactly `OrderId` then a non-empty `OrderStatus` of APPROVED or DENIED. Errors name the element (`OrderStatus`). The scenarios hold with the switch off.
  - Following the Key Decision "XML is validated against XSD only", it bundles `lib/b2b/schemas/files/OrderApproval.dtd` (the legacy content model: `OrderApproval (Order+)`, `Order (OrderId, OrderStatus)`) and `OrderApproval.dtd.xsd`, and adds the public id to `BUNDLED_SCHEMA_CATALOG`.
- **P3 — Channels (SWHR-T-0119).** `lib/messaging/outbox.ts` gains:
  - `"opc.order-approval"` → subscribers `["order-approval"]`: the decision queue (replaces task 1.2's table, SD-2).
  - `"opc.approval-notice"` → subscribers `["customer-notification"]`: the batched customer notice. Its payload is an `OrderApproval` document listing every order whose status changed. customer-notifications (swhr-i-0013, task 4.1) registers that consumer later; until then deliveries stay pending.
- **P4 — Decision processing (SWHR-T-0121).** `lib/orders/approval.ts` exports `applyApprovalBatch(tx: Tx, entries: ApprovalEntry[]): string[]` (the ids that changed) and `createOrderApprovalHandler(): Handler` (prepare `readOrderApproval`, commit `applyApprovalBatch`). For each entry in order: `UPDATE purchaseOrders SET status = ? WHERE orderId = ? AND status = 'PENDING' RETURNING`; no row means the decision is ignored silently (unknown order, or not PENDING). For each APPROVED change it builds a `SupplierOrder` from `getStoredOrder(orderId, tx)` (shipping contact → `ContactInfo`, blank e-mail as `""`; line unit prices through `minorToDecimal`) and calls `sendSupplierPurchaseOrders(tx, [so])`. After the loop, if anything changed, it enqueues exactly one `writeOrderApproval(changed)` on `opc.approval-notice`. `plugins/order-approval.ts` registers the handler for `("opc.order-approval", "order-approval")`.
- **P5 — Automatic approval (SWHR-T-0120).** `persistPurchaseOrder` returns `boolean` (true when it inserted). The `order-intake` commit, in the same transaction, enqueues `writeOrderApproval([{ orderId, status: "APPROVED" }])` on `opc.order-approval` when it inserted and `shouldAutoApprove(po.locale, totalMinor)` holds. That is the same path an administrator decision takes (2.2), so the order becomes APPROVED when the dispatcher delivers it, never inside intake. A redelivered purchase order inserts nothing and enqueues nothing.
- **P6 — Order-data service (SWHR-T-0122).** One route, `routes/api/admin/order-data.post.ts`, with a JSON body `{ type, ... }`. Logic in `lib/orders/adminData.ts`; session check in `lib/auth/adminDataSession.ts` (`requireAdminDataSession(event): Promise<AuthSession | null>`, the same cookie-or-`Session <id>` rule as `GET /api/admin/orders`, which is not changed). No session → 401 `{ error: <SWHR-R-0080 text> }`.
  - `{ type: "GETORDERS", status }` → 200 `{ orders: OrderSummary[], total: number }`, `OrderSummary = { orderId, userId, date, amount, status }`. `date` is `M/D/YYYY` in UTC without padding; `amount` is `minorToDecimal(totalValue, locale)`. Ordered by `orderId`. An order whose contact row is missing fails the request: 500 `{ error: "Could not find PENDING orders" }` (status substituted).
  - `{ type: "UPDATESTATUS", orders: { orderId?, status? }[] }` → entries without an `orderId`, or with a status other than APPROVED/DENIED, are dropped; the rest go into one `writeOrderApproval` enqueued on `opc.order-approval` in one `db.transaction`; 200 `{ result: "SUCCESS", queued: n }`. Nothing valid → nothing enqueued, `queued: 0`. No status is changed here.
  - `{ type: "REVENUE" | "ORDERS", start, end, category? }` with `MM/dd/yyyy` dates → 200 `{ groups: { name: string; value: string }[], total: string }`. The window is inclusive: from 00:00:00.000 UTC on `start` to 23:59:59.999 UTC on `end`, every status. Without `category`, groups are categories named by their en_US catalogue name, ordered by name; with `category` (a category id), only that category's lines, grouped by `itemId`. REVENUE sums `quantity × unitPrice` in **hundredths**, since each line's minor units are scaled by its order's locale fraction digits (ja_JP × 100), so locales add without conversion and without floats; values are formatted with 2 decimals. ORDERS sums `quantity` as an integer string.
  - Unknown `type` → 400 `{ error: 'Unable to process an unknown request type "<type>"' }`. An unreadable body, or missing or invalid fields → 400 `{ error: "Error processing request: <detail>. Please try again." }`.
- **P7 — Screens (SWHR-T-0123).** All built from the mockups, inside the site shell.
  - `/admin/console` becomes the landing page (SWHR-R-0185) while keeping the sign-on gating (SWHR-R-0075, R-0078): the heading "Welcome to Pet Store Administration", the explanatory text, a "Launch Rich Client" button (calls `GET /api/admin/launch` as now, then navigates to `/admin/orders`) and a "logout" button (sign-off, then `/admin`). The workspace cards and the auto-approval note are shown as the mockup does.
  - `/admin/orders` (new page) is the workspace "Pet Store Administration", with the same gating. It has Refresh, About (dialog) and Exit (back to `/admin/console`, discarding marks), an Orders tab with the "Process Pending Orders" and "View Non-Pending Orders" sub-views, and a Sales tab.
  - On mount and on Refresh it calls GETORDERS for PENDING, APPROVED, DENIED and COMPLETED, then REVENUE and ORDERS for the current range.
  - Commit sends the APPROVED marks as one UPDATESTATUS and then the DENIED marks as another, skips any empty group, sends nothing when both are empty, then reloads.
  - The busy state disables Approve, Deny, Commit, Refresh, Get Data, About and Exit, and shows "Retrieving data from the server..." or "Updating data on the server...".
  - Any failed request (non-2xx or network) opens a "Fatal Error!" dialog with the message and leaves every action disabled until the page is reloaded (D6).
  - The refresh warning is a modal: "Data is not committed. Are you sure you want to refresh?" with Cancel and "Discard and refresh".
  - Components live in `src/components/admin/`: an `OrderTable` (sortable headers, status badge, `editable` prop, row selection), a `SalesCharts` view (SVG pie with percentages and SVG bars, Start Date, End Date, Get Data, defaults 01/01/2001 and 12/31/2002), and `orderData.ts` with pure client helpers: `parseStatus` (unknown → `null`, SWHR-R-0167.02), `isValidReportDate` (strict `MM/dd/yyyy`), `validGroups` (drops a group with no name or a negative or unparseable value), `commitBatches`, and `percentShares`.
  - Amounts show as the server sends them, with thousands separators in the integer part, as in the mockup. Sorting is numeric.
  - Copy is added to `src/i18n/admin/{en,de,types}.ts`.
- **P8 — End-to-end (SWHR-T-0124).** `e2e/order-approval.spec.ts` carries the four e2e-typed cases: SWHR-C-0300 (Exit with an uncommitted mark leaves the order PENDING), SWHR-C-0324 (Launch Rich Client opens the workspace), SWHR-C-0325 (logout signs out) and SWHR-C-0327 (below):
  - 6.1: a shopper places a zh_CN order through checkout. The administrator (the seeded staff user used by `e2e/sign-on.spec.ts`) signs in, launches the workspace, approves the order, commits, and refreshes (with polling) until the order leaves Process Pending Orders and appears in View Non-Pending Orders.
  - 6.2: in Sales, a range covering today redraws the bar chart, and "2001-01-01" shows the format message with no request sent.
- **P9 — Sequencing.** SWHR-T-0119 → (SWHR-T-0121 → SWHR-T-0120) ∥ (SWHR-T-0122 → SWHR-T-0123) → SWHR-T-0124 (after both SWHR-T-0120 and SWHR-T-0123).
  - SWHR-T-0120 follows SWHR-T-0121 because its "becomes APPROVED" scenarios need the processor.
  - The two branches share no files.
  - No ticket changes `db/schema.ts`, so there is no migration this sprint.

### Phases

1. **Data model** (SWHR-T-0119): thresholds, approval document, two channels.
2. **Decision processing** (SWHR-T-0121): processor, supplier purchase orders, notice, plugin.
3. **Automatic approval** (SWHR-T-0120): intake enqueues an auto-approval.
4. **Administrator API** (SWHR-T-0122), in parallel with phases 2–3.
5. **Administrator screens** (SWHR-T-0123).
6. **End-to-end** (SWHR-T-0124).
7. **Test harness.** No new Vitest project is needed.
   - `lib/**` and `routes/**` tests run in the `server` project; `plugins/**` tests already run there (SWHR-T-0110).
   - Page and component tests sit beside their files (`client`).
   - "Queued" means reading `outboxMessages` rows by channel from the in-memory database. Processing is tested by calling the handler (prepare then commit in a `db.transaction`) or `dispatchPending`.
   - Every test is titled with its case key from `test-cases.md` (`[SWHR-C-0xxx]`).
   - E2E uses the Playwright server's fresh database (`SQLITE_PATH`) and the running dispatcher plugin.
8. **CI.** `.github/workflows/ci.yml` already runs the full gate, including E2E, on push and pull request to `vortex/**`, `dev` and `main`. No workflow change.

### Spec discrepancies

- **SD-1 — Status values (task 1.1).** The four-value enum already exists as a five-value CHECK (PRD decided behaviour 2; checkout SD-6). Task 1.1 needs no migration. SWHR-R-0167's "one of four" applies to what the administrator sees (SHIPPED_PART is not listed in any view), not to storage.
- **SD-2 — Decision table (task 1.2) and D2.** The ARCHITECTURE Key Decision "One outbox for every asynchronous hop" forbids a second queue. The durable decision record is the `OrderApproval` document on channel `opc.order-approval`, persisted by `enqueue` before the API answers (SWHR-R-0171). There is no approval-decision table.
- **SD-3 — "Validate against its declared structure" (SWHR-R-0172).** Schema validation of a bundled document follows the existing log-and-continue rule behind `B2B_VALIDATE_*`. That alone would not make reading fail. `readOrderApproval` therefore also enforces the content model itself, unconditionally (P2), which is what makes the three scenarios fail the read.
- **SD-4 — Administrator role (task 4.5).** PRD decided behaviour 11 and sign-on SWHR-R-0080 say the admin data service requires a signed-in admin **session**, and only the console requires the role. The decided behaviour wins. Task 4.5 is delivered as the session check (P6). The screens themselves stay role-gated like the console.
- **SD-5 — One transaction per order (task 3.1).** The dispatcher commits one delivery in one transaction, so a batch applies in one transaction. Each order is still evaluated on its own with a conditional update (P4), so outcomes match. A crash mid-batch retries the whole batch, and the PENDING guard makes the retry safe.
- **SD-6 — One service, typed requests (tasks 4.1–4.3).** The tasks name a GET and several POST routes. SWHR-R-0178 needs one service that rejects an unknown request type by name. One `POST /api/admin/order-data` with `type` satisfies both. `GET /api/admin/orders` (supplier orders, sign-on) keeps its path and meaning.
- **SD-7 — Report end instant (SWHR-R-0181.01).** The legacy code ends the window at midnight at the start of the end date. Here the window runs to the last millisecond of the end date (UTC), so an order placed on the end date counts. The scenario's "exactly at the end instant" still holds.
- **SD-8 — Cross-locale revenue (R4).** Totals are exact hundredths (P6), not float sums. Mixed-locale totals add numbers in different currencies, as the legacy did and as PRD decided behaviour 10 and the mockup ("Each order counts in its own prices; no currency conversion") accept.
- **SD-9 — Landing-page control label.** The mockup says "Log out"; the scenario says "logout". The scenario wins (the button reads "logout"), and PRD Open question 1 already records that the landing-page scenario may be edited.
- **SD-10 — Customer notice.** SWHR-R-0174 says a notice is "sent for customer email". The e-mail itself belongs to customer-notifications. This change enqueues the notice on `opc.approval-notice` (P3), and no e-mail is sent until swhr-i-0013 registers its consumer.
- **SD-11 — Dates in UTC.** SWHR-R-0191's M/D/YYYY date is taken in UTC, so the same order shows the same date whatever the server's time zone.
