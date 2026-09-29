---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0012
ticket: SWHR-T-0119
branch: vortex/sprint/swhr-s-0012-057cab7b
upstream: [openspec/changes/swhr-i-0010-order-approval/design.md]
downstream:
  [
    artifacts/SWHR-S-0012/SWHR-T-0119/tdd-test-result.md,
    artifacts/SWHR-S-0012/SWHR-T-0119/summary.md,
  ]
---

# PLAN — SWHR-T-0119: Order-approval data model

Change: `swhr-i-0010-order-approval` · Tasks group 1 · Requirement: **Approval document structure**

## Design reference

No UI in this ticket. The sprint's mockups are under `artifacts/SWHR-S-0012/design/` (index: `MANIFEST.md`); they are not needed here.

## Objective

Put in place what every later ticket codes against: the per-locale auto-approval thresholds, the `OrderApproval` document writer and strict reader, and the two outbox channels. There is no schema change and no migration (SD-1, SD-2).

## Steps

1. Read `openspec/changes/swhr-i-0010-order-approval/design.md`, first §Decisions D1, D2 and D5, then §Sprint planning (and the ARCHITECTURE Key Decision "XML is validated against XSD only"), the codebase findings, P1, P2 and P3, and SD-1, SD-2 and SD-3.
2. Add `lib/orders/approvalPolicy.ts` with `AUTO_APPROVAL_THRESHOLDS` (P1), plus a unit test pinning en_US 50000, ja_JP 50000 and zh_CN null. Task 1.1 needs no code: note in the summary that the status CHECK already exists.
3. Add `lib/b2b/documents/orderApproval.ts` with `ORDER_APPROVAL_PUBLIC_ID`, `writeOrderApproval` and `readOrderApproval` (P2). Mirror `purchaseOrder.ts`: `createDocument`, `appendTextElement`, `serializeDocument` with the DOCTYPE, `parseDocument`, the switch-gated `checkDocumentType` and `validateDocument`, and then the unconditional `expectRoot` and `ChildReader` checks. Add `lib/b2b/schemas/files/OrderApproval.dtd` and `OrderApproval.dtd.xsd`, and add the catalog entry in `lib/b2b/schemas/catalog.ts`. Extend the existing schema test that checks each catalog entry resolves, if there is one.
4. Add `"opc.order-approval": ["order-approval"]` and `"opc.approval-notice": ["customer-notification"]` to `Channel` and `SUBSCRIBERS` in `lib/messaging/outbox.ts` (P3).
5. Tests in `lib/b2b/documents/orderApproval.test.ts`:
   - [SWHR-C-0303] A `PurchaseOrder` root is rejected.
   - [SWHR-C-0304] `<OrderApproval/>` is rejected.
   - [SWHR-C-0305] One test with an empty `OrderStatus` and one with a missing `OrderStatus`; each error names `OrderStatus`.
   - Also: a round trip of two entries validates cleanly against the bundled XSD, `writeOrderApproval([])` throws, and each of the three failures still fails with `B2B_VALIDATE_ORDER_APPROVAL=false`.
6. Add a test in `lib/messaging/outbox.test.ts` that enqueuing on each new channel creates one delivery for its subscriber.

## File/module ownership

- `lib/orders/approvalPolicy.ts`, `lib/orders/approvalPolicy.test.ts` (new)
- `lib/b2b/documents/orderApproval.ts`, `lib/b2b/documents/orderApproval.test.ts` (new)
- `lib/b2b/schemas/files/OrderApproval.dtd`, `lib/b2b/schemas/files/OrderApproval.dtd.xsd` (new); `lib/b2b/schemas/catalog.ts` (one entry)
- `lib/messaging/outbox.ts`, `lib/messaging/outbox.test.ts` (add the two channels only)

Fixed interface, consumed by SWHR-T-0120, SWHR-T-0121 and SWHR-T-0122: `AUTO_APPROVAL_THRESHOLDS`, `ApprovalStatus`, `ApprovalEntry`, `ORDER_APPROVAL_PUBLIC_ID`, `writeOrderApproval`, `readOrderApproval` (async), and the channel names `opc.order-approval` and `opc.approval-notice` with their subscribers.

## Definition of Done

AC-1 to AC-3 by the tests above, each titled with its case key.
