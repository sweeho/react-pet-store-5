## 1. Data model

- [ ] 1.1 Add the supplier inventory table to `db/schema.ts` (item id primary key, integer quantity not null) (SWHR-T-0147)
- [ ] 1.2 Generate and commit the drizzle migration for the supplier inventory table (SWHR-T-0147)
- [ ] 1.3 Add a query helper that lists all stock records and one that reads a record by item id (SWHR-T-0147)

## 2. Stock update rules

- [x] 2.1 Implement the batch update function: selected rows only, absolute replacement, blank quantity skipped (SWHR-T-0148)
- [x] 2.2 Skip negative quantities per row without failing the batch (SWHR-T-0148)
- [x] 2.3 Reject non-numeric quantities and unknown item ids for the whole batch (design D4, D5) (SWHR-T-0148)
- [x] 2.4 Unit-test the update rules against the spec scenarios (SWHR-T-0148)

## 3. Update unit of work

- [ ] 3.1 Wrap stock writes, pending supplier order re-fulfilment and invoice outbox writes in one database transaction (SWHR-T-0149)
- [ ] 3.2 Invoke the order-fulfillment re-attempt for every PENDING supplier order after the stock writes (SWHR-T-0149)
- [ ] 3.3 Record an invoice for each order that shipped anything in this attempt (SWHR-T-0149)
- [ ] 3.4 Integration-test restock-ships-order, insufficient-restock and rollback-on-failure scenarios (SWHR-T-0149)

## 4. Server API

- [ ] 4.1 Add `GET /api/supplier/inventory` returning all stock records, restricted to the supplier staff role (SWHR-T-0150)
- [ ] 4.2 Add `POST /api/supplier/inventory` accepting the batch update and running the unit of work (SWHR-T-0150)
- [ ] 4.3 Return a distinguishable error when the stock list cannot be retrieved (SWHR-T-0150)
- [ ] 4.4 Route tests for both endpoints including authorisation refusal (SWHR-T-0150)

## 5. Initial stock load

- [ ] 5.1 Add the seed data set for EST-1 through EST-29 at quantity 10000 (SWHR-T-0151)
- [ ] 5.2 Implement the initial load with skip-when-populated and forced replace (SWHR-T-0151)
- [ ] 5.3 Gate the initial load behind the decision on who may run it (design Q1) (SWHR-T-0151)
- [ ] 5.4 Test empty, already-populated and forced load scenarios (SWHR-T-0151)

## 6. Screens

- [ ] 6.1 Build the supplier home page with the back-order explanation, Display Inventory and Logout actions (SWHR-T-0152)
- [ ] 6.2 Build the inventory update page with Item Id, Existing Quantity, New Quantity and Update columns and one Submit control (SWHR-T-0152)
- [ ] 6.3 Build the inventory unavailable state for empty inventory and failed lookup (SWHR-T-0152)
- [ ] 6.4 Build the update confirmation page with Display Inventory and Logout actions (SWHR-T-0152)
- [ ] 6.5 UI tests for each page and state (SWHR-T-0152)
- [ ] 6.6 Playwright spec covering home, edit, submit and confirmation (SWHR-T-0152)
