# PLAN — SWHR-T-0140: Test harness (task group 7)

Change: `swhr-i-0011-order-fulfillment`. Read its `design.md` §"Sprint planning — SWHR-S-0014" first. Requirements: **Order capture is separated from order processing and supplier fulfilment**, **Re-fulfilment of pending supplier orders on stock update** (stock update releases a waiting order), and coverage of every scenario.

## Design reference

No design blocks: this capability has no screens (the change's design.md §User interface).

## Objective

Prove the whole flow from checkout to COMPLETED, in the browser and at integration level, and confirm that every scenario in the change has an executed test.

## Steps

1. Read design §Phases 7–8 and SD-6.
2. Add `lib/b2b/scenarios/order-fulfillment.test.ts`, modelled on `order-to-invoice.test.ts`, which drives dispatcher rounds:
   - an en_US order under 500 goes through intake, auto-approval, supplier intake and invoice to COMPLETED;
   - an order short of EST-6 stays with its supplier order PENDING and its customer order APPROVED;
   - `applyStockUpdate` raises EST-6, and the next rounds bring both orders to COMPLETED (SWHR-R-0220.01, AC-2).
3. Add `e2e/order-fulfillment.spec.ts` for SWHR-C-0340:
   - place an order under 500 through checkout (fill the billing e-mail, as SWHR-S-0013 requires) and assert the order complete screen appears;
   - then poll the administrator order views (`POST /api/admin/order-data` GETORDERS, signed in as the seeded administrator) until the order shows COMPLETED;
   - read the supplier order through `GET /api/admin/orders`.

   Keep helpers inside the spec file rather than editing `e2e/account-helpers.ts`.

4. SWHR-C-0385 (e2e) waits on swhr-i-0012's stock-update surface (SD-6). Do not add a test-only route for it. Record in the ticket comment that the integration test in step 2 is this sprint's evidence.
5. Audit tasks 7.1–7.4: list each delta scenario with the test that cites its case key. Add a test only for a scenario with none.

## File/module ownership

- new `lib/b2b/scenarios/order-fulfillment.test.ts`
- new `e2e/order-fulfillment.spec.ts`
- `lib/b2b/scenarios/coverage.test.ts` (only if the audit needs a gap filled there)

## Definition of Done

AC-1 to AC-3 of the ticket.
