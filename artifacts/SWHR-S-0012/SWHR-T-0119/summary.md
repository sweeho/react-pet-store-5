# Summary — SWHR-T-0119

Added the approval data model: `AUTO_APPROVAL_THRESHOLDS` (en_US 50000, ja_JP 50000, zh_CN null), the `OrderApproval` writer and always-strict reader, bundled `OrderApproval.dtd` and `.dtd.xsd` with a catalog entry, and outbox channels `opc.order-approval` and `opc.approval-notice`.

Task 1.1 needs no code: the status CHECK already holds the values.

Files: `lib/orders/approvalPolicy.ts`, `lib/b2b/documents/orderApproval.ts`, `lib/b2b/schemas/files/OrderApproval.dtd{,.xsd}`, `lib/b2b/schemas/catalog.ts`, `lib/messaging/outbox.ts`, plus tests.

AC: the three scenarios fail the read with validation on and off. Verification: `bun run verify` exit 0, 834 tests passed.
