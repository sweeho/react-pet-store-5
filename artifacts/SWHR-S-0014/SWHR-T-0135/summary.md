---
ticket: SWHR-T-0135
---

# Summary — SWHR-T-0135

Strict `createPurchaseOrder` (throws `DuplicateOrderError`, savepoint-atomic); `persistPurchaseOrder` is now check-then-create and stays idempotent. `getStoredOrder` adds `billingContact`, `shippingContact` (both from the one stored contact) and per-line `quantityShipped`; `contact`/`address` kept. New `lines.ts` exports only `setShippedQuantity` and `copyLine`.

Files: `lib/orders/store.ts`, `store.test.ts`, `lines.ts`, `lines.test.ts`, `errors.ts`.

AC coverage: AC-1..9 each have a test titled with cases SWHR-C-0341..0350 (no 0346); AC-10 signatures exported as specified. Card masking asserted in C-0341 (SD-2). The design mockups do not apply (no UI).

Verification: `bun run verify` — exit 0, 911 tests passed.
