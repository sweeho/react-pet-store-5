---
ticket: SWHR-T-0138
---

# Summary — SWHR-T-0138

Added `applyInvoice` and `createOrderFulfillmentHandler` (`lib/orders/invoice.ts`): invoiced quantities are added to every line with the item id, unknown items are ignored, and exact equality of all lines gives COMPLETED plus one `opc.completed-order` message (payload: order id), otherwise SHIPPED_PART. An unknown order throws `OrderNotFoundError` so the delivery retries. `plugins/order-fulfillment.ts` registers the consumer on `opc.invoice` via `resolveChannel`. The approval handler's commit now runs inside `runStep("order-approval")`; `applyApprovalBatch` is unchanged.

Files: `lib/orders/invoice.ts`, `invoice.test.ts`, `approval.ts`, `approval.test.ts`, `intake.test.ts`, `plugins/order-fulfillment.ts`, `plugins/order-fulfillment.test.ts`.

AC coverage: AC-1..11 map to cases SWHR-C-0362..0371 and 0354; AC-12 (P5 contract) by exports and the plugin test. No UI, so no design reference.

Verification: `bun run verify` — exit 0, 943 tests passed.
