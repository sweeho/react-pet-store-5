# SWHR-T-0121 summary

Added the `opc.order-approval` consumer. `applyApprovalBatch` updates each order only where status is PENDING, sends one supplier purchase order per approval, and enqueues one `opc.approval-notice` listing the changed orders. Unknown or already-decided orders are ignored. A Nitro plugin registers it.

Files: `lib/orders/approval.ts`, `lib/orders/approval.test.ts`, `plugins/order-approval.ts`, `plugins/order-approval.test.ts`.

AC coverage: duplicate decision (SWHR-C-0306), batch approve/deny (SWHR-C-0307), auto-approved en_US 120 (SWHR-C-0308), plus unknown order, redelivery and malformed payload tests.

Verification: `bun run verify` (lint, typecheck, unit) passed. No UI, so the design was not consulted. Stub-first red required the plugin files to be added after the red commit.
