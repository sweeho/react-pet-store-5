---
ticket: SWHR-T-0140
---

# Summary — SWHR-T-0140

Added the whole-flow proof for order fulfilment. No production code changed.

- `lib/b2b/scenarios/order-fulfillment.test.ts`: dispatcher rounds from intake through auto-approval, supplier intake and invoice to COMPLETED; an order short of EST-6 waits (supplier PENDING, customer APPROVED) until `applyStockUpdate` releases it (SWHR-C-0340, SWHR-C-0385).
- `e2e/order-fulfillment.spec.ts`: en_US checkout under 500, then polls `POST /api/admin/order-data` (GETORDERS, COMPLETED) and reads `GET /api/admin/orders` as the seeded administrator (SWHR-C-0340).
- Audit: every approved case of the change except 0340 and 0385 already had a citing test; those two are now covered. `coverage.test.ts` untouched.

Deviations: SWHR-C-0385 stays integration-level (SD-6); the e2e per-shipment invoice count is not readable through any admin view, so the e2e asserts the supplier order and customer order reach COMPLETED. No valid red run exists because the behaviour was already built.

Verification: `bun run verify:full` — exit 0, 963 unit tests and 70 Playwright tests passed.
