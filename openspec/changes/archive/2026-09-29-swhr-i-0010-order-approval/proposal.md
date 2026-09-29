## Why

The legacy Java Pet Store 1.3.2 decides which orders need a human decision, lets an administrator approve or deny them, and feeds the outcome into fulfilment and customer notification. None of this is written down outside a short user guide, and the guide disagrees with the code on the approval threshold. The rebuild needs an explicit, testable statement of that behaviour before it can replace it.

## What Changes

- Add the `order-approval` capability: automatic approval thresholds by locale, the pending-order review workflow, batched commit of approve/deny decisions, asynchronous hand-off to order processing, idempotent application of decisions to PENDING orders only, and the downstream supplier purchase order and customer notice.
- Add administrator order listing by status and the sales revenue and order-count reports that live in the same administrator client.
- Add seven administrator screen requirements: landing page, client workspace, Process Pending Orders display, Process Pending Orders decisions, View Non-Pending Orders, sales charts, and order-row display.
- Record the legacy disputes (threshold, date formats, report scope) in `design.md` for a human decision rather than resolving them silently.

## Capabilities

### New Capabilities

- `order-approval`: automatic and administrator approval of orders, the administrator order views and the administrator sales reports.

### Modified Capabilities

- None.

## Impact

- Data model: order status values PENDING, APPROVED, DENIED, COMPLETED (plus the partially-shipped state owned by fulfilment); order date and category/item line data used by reports.
- Server: an administrator order-data API (list by status, submit decisions, revenue report, order-count report) restricted to the administrator role.
- Asynchronous processing: an approval-decision queue consumed by order processing, which triggers supplier purchase orders and customer email.
- UI: administrator pages replacing the legacy desktop rich client.
- Depends on `sign-on` for the administrator role, and on the fulfilment and notification capabilities that consume approval outcomes.
