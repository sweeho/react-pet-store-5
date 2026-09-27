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
