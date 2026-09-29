---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0012
ticket: SWHR-T-0122
branch: vortex/sprint/swhr-s-0012-057cab7b
upstream: [openspec/changes/swhr-i-0010-order-approval/design.md]
downstream:
  [
    artifacts/SWHR-S-0012/SWHR-T-0122/tdd-test-result.md,
    artifacts/SWHR-S-0012/SWHR-T-0122/summary.md,
  ]
---

# PLAN — SWHR-T-0122: Administrator order-data service

Change: `swhr-i-0010-order-approval` · Tasks group 4 · Requirements: **Order summary for administrator review**, **List orders by status**, **Asynchronous delivery of approval decisions**, **Invalid administrator data requests**, **Sales revenue report**, **Order-count report**, **Report window and status coverage**

## Design reference

No UI in this ticket. The sprint's mockups are under `artifacts/SWHR-S-0012/design/` (index: `MANIFEST.md`); they are not needed here.

## Objective

Add one `POST /api/admin/order-data` service behind an admin session. It lists orders by status, queues decision batches without applying them, and answers the revenue and order-count reports. Unknown or malformed requests get a descriptive error.

## Steps

1. Read `openspec/changes/swhr-i-0010-order-approval/design.md`, first §Legacy flow step 3, D4, D5, R1 and R4, then §Sprint planning P6, and SD-4, SD-6, SD-7, SD-8 and SD-11.
2. Add `lib/auth/adminDataSession.ts` `requireAdminDataSession` (P6), copying the cookie-or-`Session <id>` logic from `routes/api/admin/orders.get.ts`. Leave that route unchanged.
3. Add `lib/orders/adminData.ts` with:
   - `listOrdersByStatus(status): { orders: OrderSummary[]; total: number }`
   - `queueDecisions(entries: unknown[]): number`
   - `salesReport(kind: "REVENUE" | "ORDERS", start: Date, end: Date, category?: string): { groups: { name: string; value: string }[]; total: string }`
   - `parseReportDate(text): Date | null`, strict `MM/dd/yyyy` in UTC
     Use drizzle only, with no raw SQL strings. Revenue is summed in hundredths (P6).
4. Add `routes/api/admin/order-data.post.ts`. It dispatches on `type` (GETORDERS, UPDATESTATUS, REVENUE, ORDERS), with the status codes and bodies in P6. Error texts are fixed:
   - `Unable to process an unknown request type "<type>"`
   - `Error processing request: <detail>. Please try again.`
   - `Could not find <STATUS> orders`
5. Integration tests in `routes/api/admin/order-data.test.ts` use a real `H3Event`, a signed-on admin session, orders seeded with `persistPurchaseOrder`, and statuses set directly:
   - [SWHR-C-0292] The j2ee order of 2002-02-03 for 612.50 has orderId, userId "j2ee", date "2/3/2002", amount "612.50" and status.
   - [SWHR-C-0294] 3 PENDING and 2 APPROVED give exactly 3, each once, total 3.
   - [SWHR-C-0295] DENIED with none gives `[]` and 0.
   - [SWHR-C-0296] A PENDING order with its contact row deleted fails with an error naming PENDING.
   - [SWHR-C-0301] 1001 APPROVED and 1002 DENIED give one `opc.order-approval` message with both, 200 SUCCESS, and both still PENDING.
   - [SWHR-C-0302] An entry without orderId gives a queued document with only 1002.
   - [SWHR-C-0313] `type: "DELETE"` gives 400 with the unknown-type text.
   - [SWHR-C-0314] A non-JSON body gives 400 with "Please try again."
   - [SWHR-C-0315] Fish 60.00, Dogs 500.00, total 560.00.
   - [SWHR-C-0316] category FISH gives EST-1 20.00, EST-2 15.00, total 35.00.
   - [SWHR-C-0317] Fish 5, Dogs 1, total 6.
   - [SWHR-C-0318] An order at 23:59:59.999 UTC on the end date is included.
   - [SWHR-C-0319] A DENIED order in the window is counted.
   - Also: no session gives 401 with the SWHR-R-0080 text; a ja_JP line adds in hundredths.

## File/module ownership

- `lib/auth/adminDataSession.ts` (new)
- `lib/orders/adminData.ts`, `lib/orders/adminData.test.ts` (new)
- `routes/api/admin/order-data.post.ts`, `routes/api/admin/order-data.test.ts` (new)

Consumes unchanged: `writeOrderApproval`, `enqueue`, `minorToDecimal`, `findAuthSessionById` and `getAuthSession`. Fixed interface, consumed by SWHR-T-0123 and SWHR-T-0124: the request and response JSON in P6 (`OrderSummary`, `{ orders, total }`, `{ result: "SUCCESS", queued }`, `{ groups, total }`, `{ error }`).

## Definition of Done

AC-1 to AC-13 by the tests above, each titled with its case key.
