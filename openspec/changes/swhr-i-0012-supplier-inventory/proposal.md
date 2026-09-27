## Why

The legacy Java Pet Store 1.3.2 supplier application keeps its own stock level per catalogue item, and supplier staff maintain it through a small web interface. Updating stock is also the trigger that retries back-ordered supplier orders and emits their invoices. None of this is documented beyond the demo usage guide. Spec extraction SX-0001 recovered it as 11 reviewed IR records under `supplier-inventory` (drawn from the supplier module and the product docs); this change states them as verifiable requirements so the rebuild can match them.

## What Changes

- Adds the `supplier-inventory` capability: the supplier stock record, the batch stock-update rule (replace, selected rows only, negatives ignored), the update unit of work that re-attempts pending supplier orders and sends invoices, and the initial stock load.
- Adds four screen requirements: the supplier home screen, the inventory update screen, its inventory-unavailable state, and the update confirmation screen.
- Flags legacy defects and open decisions (unguarded initial-load endpoint, swallowed invoice failures, unhandled non-numeric input, undefined pending-order priority) in `design.md` rather than carrying them into requirements.

## Capabilities

### New Capabilities

- `supplier-inventory`: supplier stock records, staff stock maintenance, stock-update-driven re-fulfilment of pending supplier orders, and initial stock seeding.

### Modified Capabilities

- none

## Impact

- Data model: one new SQLite table in `db/schema.ts` (supplier inventory: item id primary key, integer quantity NOT NULL); one new migration in `drizzle/`.
- Server: a Nitro API under `routes/api/supplier/` for listing inventory, submitting a batch update, and (subject to an open decision) running the initial load.
- SPA: pages under `src/pages/supplier/` for the home, inventory and confirmation screens.
- Dependencies: sign-on (supplier staff authentication and the role that may update stock) and order-fulfillment (the per-order fulfilment and invoicing this change invokes). This change calls them and does not specify them.
