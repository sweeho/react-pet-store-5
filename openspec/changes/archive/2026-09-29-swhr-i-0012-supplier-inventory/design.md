## Context

In the legacy application the supplier is a separate web application inside the Pet Store demo. It owns a stock table keyed by catalogue item id. Stock is consumed by supplier order fulfilment (specified in `order-fulfillment`) and replenished only by supplier staff typing new absolute quantities into a web form. Each successful stock update also retries every supplier order still pending, so that back-ordered items ship as soon as stock arrives.

Source records (IR, `capability_key: supplier-inventory`): SI-ENT-0001 / SUPINV-ENT-0001 (stock record), SI-SCR-0002 / SI-SCR-0003 / SUPINV-SCR-0001 / supplier-inventory-SCREEN-0001 / SUPPLIER-INVENTORY-SCREEN-0001 (inventory screen and empty state), supplier-inventory-REQ-0001 (documented edit flow), SI-BR-0004 / SUPINV-RULE-0001 / SUPINV-RULE-0002 (update rule), SI-WF-0005 / SUPINV-WF-0001 (update unit of work), SI-WF-0006 / SUPINV-REQ-0001 (home screen and entry routing), SI-BR-0007 / SUPINV-RULE-0003 (initial load). The two code passes agreed on every rule; they differed only in grading.

### Legacy implementation notes

- Stock record: CMP entity `InventoryEJB`, fields `itemId` (PK) and `quantity`; table `InventoryEJBTable` (`itemId VARCHAR(255)` PK, `quantity INTEGER NOT NULL`). No CHECK constraint, so the schema permits negative stock; only the web update path refuses negatives. `addQuantity` exists but is commented out: there is no additive receipt path.
- Routing: a single servlet `RcvrRequestProcessor` dispatches POSTs on a hidden `currentScreen` field (`displayinventory`, `updateinventory`, `logout`); GET forwards to `index.jsp`. The GET/POST distinction is held in a servlet instance field (`fromDoGet`), which is not thread-safe — a defect, not a requirement.
- Inventory screen: `displayinventory.jsp`, reading `DisplayInventoryBean.getInventory()` (finder `findAllInventoryItems`, `SELECT OBJECT(a) FROM Inventory a`, no ordering). Form fields are named `qty_<itemId>` and `item_<itemId>`; the update rule iterates request parameters starting with `item_`, so only ticked rows are considered.
- The "no items" message is shown only when the lookup returns null, which happens when the lookup or finder throws; an empty table produces an empty grid. The spec requires the message in both cases (the evident intent) — see Open Questions Q3.
- Update unit of work: `UserTransaction` begun in the servlet; `updateInventory` → `processPendingPO` (finds PENDING supplier orders) → `sendInvoices` (JMS topic publish) → commit → forward to `back.jsp`.
- Initial load: `PopulateServlet` at `/Populate`, parameter `forcefully`, seed file `Populate-UTF8.xml` (EST-1..EST-29, quantity 10000). Reached from the storefront's populate chain (`populating.jsp`); standalone reachability from supplier screens is unresolved.
- Access control is enforced by a web security constraint on the dispatcher (role `administrator`, principal `supplier`) and a programmatic role check on the inventory page. That rule is owned by `sign-on` (SIGNON-RULE-0001) and is not restated here.

## Goals / Non-Goals

Goals:

- Reproduce stock maintenance semantics exactly: absolute replacement, selected rows only, blank and negative values ignored per row.
- Keep stock update, pending-order re-fulfilment and invoice emission in one unit of work.
- Provide the four supplier screens with the same visible contract.

Non-Goals:

- Supplier order fulfilment and invoice content (owned by `order-fulfillment`).
- Authentication, roles and logout (owned by `sign-on`).
- Additive stock receipts, stock history or audit trail — none exist in the legacy system.

## Decisions

- D1. Stock lives in a dedicated `supplier_inventory` table in `db/schema.ts` (`item_id text primary key`, `quantity integer not null`), generated into one `drizzle/` migration. No CHECK constraint is added, matching legacy; the non-negative rule is enforced in the update handler. Fulfilment decrements run through the same table.
- D2. Batch update is one POST to `routes/api/supplier/inventory.post.ts` carrying `[{ itemId, quantity }]` for selected rows only; the SPA does the selection filtering, the server re-applies the blank/negative rules so the rule holds for any client.
- D3. The unit of work is one better-sqlite3 transaction (drizzle `db.transaction`) covering the stock writes and pending-order re-fulfilment; invoices are written to the message outbox defined by `order-fulfillment` inside the same transaction, so they are emitted only if the commit succeeds. This deliberately departs from legacy (invoices published before commit, failures swallowed) — see Q2.
- D4. Non-numeric quantity input is rejected per row client-side and server-side (400 with the offending item ids, nothing applied). Legacy throws an unhandled error; the spec leaves the exact message open (Q4).
- D5. An unknown item id in a batch is rejected with the batch (400), rather than silently stopping remaining updates as legacy does.

## Risks / Trade-offs

- R1. The legacy initial-load endpoint is unauthenticated and `forcefully=true` resets every seeded stock level; its redirect parameters are an open redirect. The rebuild must not expose it publicly (Q1).
- R2. Pending-order re-fulfilment order is whatever the finder returns; with scarce stock, which order fills first is undefined (Q5). The spec leaves the order unspecified until a human decides.
- R3. The legacy login form pre-fills `supplier`/`supplier`; do not carry this forward (owned by `sign-on`).
- R4. The not-authorised copy on the inventory page refers to "status of orders"; copy is a product decision.

## Migration Plan

Greenfield table; the initial-load operation seeds EST-1..EST-29 at 10000 for development and demo data. No legacy data migration is specified.

## Open Questions

- Q1. Is the initial-load operation in scope for the rebuild, and which role may run it (and may it force-reset)?
- Q2. Required atomicity between stock/order update and invoice emission: roll back on invoice failure, or commit and retry invoice later?
- Q3. Should the "no items in inventory" state show for an empty inventory, a failed lookup, or both (spec assumes both; a failed lookup may warrant a distinct error)?
- Q4. Validation feedback for non-numeric or negative quantities: legacy ignores negatives silently; should the rebuild warn?
- Q5. Priority order for re-fulfilling pending supplier orders when stock is scarce.

## Sprint planning — SWHR-S-0015

This section was added at sprint planning (SWHR-T-0144). The sections above describe the change as extracted from the legacy system. This section describes the repository as it stands on sprint base `24dccab` (SWHR-S-0014 landed) and fixes the interfaces the six tickets code against. Where this section and D1–D5 disagree, this section wins, and the disagreement is listed under Spec discrepancies. The idea canvas's "Current State" and "Affected Code" sections describe the bootstrap template and are stale; ignore them.

### Codebase findings

Much of this change was built by order fulfilment (swhr-i-0011) and sign-on (swhr-i-0005):

| Change asks for                  | Already in the repo                                                                                                                                                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stock table (D1, tasks 1.1, 1.2) | `supplierInventory` (`itemId` text PK, `quantity` integer NOT NULL, no CHECK) in `db/schema.ts`, migration `drizzle/0008_lazy_jimmy_woo.sql`. No query helpers.                                                                                                                                       |
| Seed data (task 5.1)             | `db/seed/inventory.ts` `seedInventory(db)` inserts EST-1..EST-29 at 10000. `db/client.ts` calls it when the table is empty. There is no forced mode.                                                                                                                                                  |
| Unit of work (D3, tasks 3.1–3.3) | `lib/supplier/stock.ts` `applyStockUpdate(tx, updates, now)` upserts absolute quantities, calls `refulfilPendingSupplierOrders` (ascending order id, one savepoint per order, **every** failure swallowed) and `publishInvoices` on `opc.invoice` in the caller's transaction. It has no input rules. |
| Supplier sign-in, role, sign-out | `/supplier/signin`, `/supplier/login-error`, `/supplier/signed-out` (re-entry link, SWHR-R-0083). `GET /api/staff/session?realm=supplier` returns `isAdministrator`. `requireRole(event, "supplier", "administrator")` in `lib/auth/roles.ts`. `POST /api/staff/signoff` with realm supplier.         |
| Supplier area page               | `src/pages/supplier/index.tsx` redirects to sign-in when signed off, shows "Not authorised" without the role, and otherwise a "Coming soon" placeholder. The header and footer already link `/supplier`.                                                                                              |
| Shared UI                        | `EmptyState`, `ErrorState`, `LoadingState`, `AsyncContent` (`src/components/state`), `Button`, `Input` (`src/components/ui`). The admin order table in `src/pages/admin/orders.tsx` is the nearest table markup.                                                                                      |
| CI                               | `.github/workflows/ci.yml` runs on pushes and pull requests to `vortex/**`, `dev`, `main`.                                                                                                                                                                                                            |

### Decisions (fixed interfaces)

Every signature below is a contract between tickets. A ticket that needs to change one escalates to planning instead.

- **P1 — Stock record access (group 1, SWHR-T-0147).** New `lib/supplier/inventory.ts`: `StockRecord { itemId: string; quantity: number }`; `listStockRecords(executor = db): StockRecord[]`, sorted by item id with a numeric-aware comparison (EST-2 before EST-10); `getStockRecord(itemId, executor = db): StockRecord | null`; `createStockRecord(tx, record): void`, a plain insert that throws and writes nothing for a duplicate item id or a missing quantity (the PK and NOT NULL do the refusing). No schema or migration change: tasks 1.1 and 1.2 are verified, not rebuilt.
- **P2 — Batch rule (group 2, SWHR-T-0148).** New pure `lib/supplier/stockBatch.ts`: `StockBatchRow { itemId: string; update: boolean; quantity: string }` (the raw text of the New Quantity box). `planStockBatch(rows, knownItemIds: ReadonlySet<string>): StockBatchPlan`. Per row, in order: not ticked → skip; trimmed quantity blank → skip; not matching `^-?\d+$` → invalid; negative → skip silently; item id not in `knownItemIds` → unknown; otherwise an update `{ itemId, quantity: Number }` that replaces the stored value. Any invalid or unknown row rejects the whole batch: `{ ok: false, invalid, unknown }`. Otherwise `{ ok: true, updates }`. Zero is an update.
- **P3 — Unit of work (group 3, SWHR-T-0149).** New `lib/supplier/inventoryUpdate.ts`: `updateInventory(rows, now = new Date()): UpdateInventoryResult`. It runs one `db.transaction`: read the known ids through `listStockRecords(tx)`, plan with P2, and on a rejected plan return it with nothing written. Otherwise it calls `applyStockUpdate(tx, updates, now)` and returns `{ ok: true, updated, invoicedOrderIds }`. Any throw escapes and rolls the whole transaction back. In `lib/supplier/stock.ts`, `fulfilSupplierOrder` builds the invoice before it writes anything and wraps a build failure in a new `InvoiceBuildError` (`lib/supplier/errors.ts`, `.cause` set). `refulfilPendingSupplierOrders` skips an order only on `InvoiceBuildError`; every other error propagates (SD-2). "Invoice sent" means queued on `opc.invoice` in the same transaction (D3, Q2).
- **P4 — API (group 4, SWHR-T-0150).** `routes/api/supplier/inventory.get.ts` and `inventory.post.ts`, both starting with `requireRole(event, "supplier", "administrator")` (401 / 403).
  - GET → 200 `{ items: StockRecord[] }`, or 500 `{ error: "INVENTORY_UNAVAILABLE" }` when the lookup throws. Distinguishable, so Q3 can be decided in the UI alone.
  - POST body `{ rows: StockBatchRow[] }`, every row of the screen (SD-3). A malformed body → 400 `{ error: "INVALID_BATCH", invalid: [], unknown: [] }`. A rejected plan → 400 `{ error: "INVALID_BATCH", invalid, unknown }`. Commit → 200 `{ updated }`. A throw → 500. Nothing is written except on 200.
- **P5 — Initial load (group 5, SWHR-T-0151).** `db/seed/inventory.ts` exports `loadInitialStock(db, { force = false } = {}): "loaded" | "skipped"`, replacing `seedInventory`. Unforced: skip when any stock record exists, else insert EST-1..EST-29 at 10000. Forced: upsert each seeded item to 10000, leaving any other item untouched. `db/client.ts` calls it unforced at startup. **No HTTP route runs it** (R1 closed). A forced reload is reachable only by calling the function (Q1: the role that may run it after launch stays a human decision).
- **P6 — Screens (group 6, SWHR-T-0152).** `src/pages/supplier/index.tsx` becomes the home page; new `inventory.tsx` and `updated.tsx`. Every page keeps the existing gate: signed off → `/supplier/signin`; no role → the existing "Not authorised" state. Logout posts `POST /api/staff/signoff` `{ realm: "supplier" }` and follows its redirect to `/supplier/signed-out`. The inventory page renders `GET /api/supplier/inventory`; an empty list **or** a failed GET shows "There are no items in inventory." with no table and no Submit (R-0231, SD-6). Submit posts every row; 200 → navigate to `/supplier/updated`; any other answer → an inline error and no navigation. English literals only, like the existing supplier pages (sign-on P12). Layout follows the mockups under the design reference below, with the SD-7 corrections.
- **P7 — Order of work.** Groups 1, 2 and 5 start in parallel. 3 waits for 1 and 2; 4 waits for 3; 6 waits for 4. The ownership maps in each PLAN.md are disjoint.

### Design reference

Exported byte-exact from idea SWHR-I-0012, doc v12, to `artifacts/SWHR-S-0015/design/` (index `MANIFEST.md`): a wireframe and a mockup each for the supplier home, the inventory screen, the no-items state and the update confirmation.

### Spec discrepancies

These are recorded as observed. Nothing in the delta spec was edited.

- **SD-1 — Already built.** Tasks 1.1, 1.2, 5.1 and most of 3.1–3.3 exist (see Codebase findings). Their tickets verify them, add the missing pieces and cite the scenarios; they do not rebuild. D1's snake_case `supplier_inventory` is the camelCase `supplierInventory` the repo already has.
- **SD-2 — Roll back the update or skip the order.** SWHR-R-0227.03 says a re-fulfilment failure rolls back the stock change. Order-fulfillment SWHR-R-0220.02 (spec of record) and ARCHITECTURE's Key Decision say each pending order runs in its own savepoint, so a failing order is skipped. The shipped code swallows every error, which fails SWHR-R-0227.03. P3 keeps both: only an invoice-build failure skips its order (the SWHR-R-0220.02 case); any other failure aborts the whole update. The ARCHITECTURE Key Decision is amended to match.
- **SD-3 — What Submit sends.** D2 says the SPA sends only ticked rows. SWHR-R-0230 says Submit "sends every row's entries as one batch". P4 sends every row with its `update` flag, so the selection rule lives in one place, the server.
- **SD-4 — Non-numeric input.** D4 rejects the whole batch with a 400. The canvas's technical approach skips it like a negative, pending Q4. D4 is the change's decision and is kept. "12.5" is non-numeric.
- **SD-5 — Unknown item id.** Per D5 the whole batch is rejected. `applyStockUpdate` upserts, and would silently create a stock record for an unknown id, so P3 plans before it writes.
- **SD-6 — Lookup failure message.** SWHR-R-0231.02 shows "no items in inventory" when the list cannot be loaded. The canvas's open question prefers the shell's error frame with Try again, because "no stock" may prompt staff to re-enter everything. The spec is built; the API keeps the failure distinguishable (P4), so a human can change only the page later.
- **SD-7 — Mockups against the spec.** The inventory mockup labels its columns "Item ID" and "Current Quantity" and shows Submit above and below the table. The spec requires "Item Id", "Existing Quantity", "New Quantity", "Update" and one Submit, so the screen uses the spec's labels and one Submit below the table. The home mockup's copy does not mention "Back Ordered"; the page states that updating inventory lets the supplier fill items marked "Back Ordered". The confirmation must state that the inventory was updated successfully. Everything else follows the mockups.
- **SD-8 — Pending-order priority (Q5).** Order fulfilment already re-tries pending orders in ascending order id, which is oldest first because ids come from one counter. Kept.
- **SD-9 — Not-authorised copy (R4).** The existing supplier page says "You are not authorised to update orders." It belongs to sign-on (SWHR-R-0082.01) and is kept unchanged.

### Phases

1. **Data model** (group 1). Stock record access and the SWHR-R-0224 tests.
2. **Rules** (group 2). The pure batch plan and its tests.
3. **Unit of work** (group 3). `updateInventory` and the narrowed re-fulfilment skip.
4. **API** (group 4). Both routes and their tests, including authorisation refusal.
5. **Initial load** (group 5). Forced and unforced load, startup call.
6. **Screens** (group 6). Three pages, the no-items state and their page tests.
7. **Test harness.** Every approved case SWHR-C-0390..0412 gets a citing test in the ticket that owns its scenario. Integration cases run in the Vitest `server` project (`lib/**`, `routes/**`), with the in-memory database. The unit page cases (C-0404, C-0407, C-0409, C-0410, C-0411) are page tests in the `client` project with `fetch` stubbed. The e2e cases (C-0405, C-0406, C-0408, C-0412) live in the new `e2e/supplier-inventory.spec.ts`, which signs in as the seeded `supplier` user. Playwright runs fully parallel against one database, and other specs order EST-1 and EST-6, so the spec never sets a stock level below 10.
8. **CI.** No workflow change is needed. `ci.yml` already triggers on `vortex/**` and runs the unit and Playwright suites; the new tests land in those jobs by path.

### Risks

- Narrowing the re-fulfilment skip (SD-2) changes shipped order-fulfillment code. `lib/supplier/stock.test.ts` (SWHR-C-0386) and `lib/b2b/scenarios/order-fulfillment.test.ts` are the regression guard and must stay green unchanged in behaviour.
- `src/pages/supplier/index.test.tsx` asserts the "Coming soon" placeholder; SWHR-T-0152 rewrites it with the page. `e2e/shell.spec.ts` only checks that `/supplier` renders in the shell.
- A forced initial load overwrites real stock. It has no HTTP entry point, and a human still has to decide who may run it after launch (Q1).
