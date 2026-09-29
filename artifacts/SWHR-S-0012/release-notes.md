---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0012
idea: SWHR-I-0010
branch: vortex/sprint/swhr-s-0012-057cab7b
upstream: [artifacts/SWHR-S-0012/qa-test-report.md, artifacts/SWHR-S-0012/sprint-summary.md]
---

# Release notes — SWHR-S-0012

## Added

- **Automatic approval.** A placed English (US) order under 500 or Japanese order under 50000 is approved without anyone looking at it, each compared in its own prices. Every other order waits for an administrator, including every Chinese order. (SWHR-T-0119, SWHR-T-0120)
- **Administrator landing page.** The header's "Administration" link opens a page with an explanation, "Launch Rich Client" and "logout". (SWHR-T-0123)
- **Pet Store Administration workspace.** Process Pending Orders is a sortable table (ID, User ID, Date, Amount, Status) with yellow/green/red status badges. The administrator marks selected rows Approved or Denied, or changes one row, and nothing takes effect until Commit. View Non-Pending Orders shows the same columns read-only. Refresh warns before discarding uncommitted marks, a busy message pauses every action while the server works, and a server failure shows a Fatal Error dialog that ends the session. (SWHR-T-0123)
- **Sales charts.** A pie chart of revenue share and a bar chart of ordered quantity by category. Each has its own Start Date and End Date (MM/dd/yyyy, default 01/01/2001–12/31/2002) and Get Data. Orders in every status are counted, and an order on the end date is included. (SWHR-T-0122, SWHR-T-0123)
- **Safe decisions.** Commit answers as soon as the decisions are queued. A decision applies only while the order is still Pending, so approving twice never sends the supplier a second order. Each approval sends the supplier a purchase order, and each batch queues one customer notice. (SWHR-T-0121, SWHR-T-0122)

## Changed

- `/admin/console` is now the administrator landing page, and the workspace lives at `/admin/orders`. Sign-on gating is unchanged. (SWHR-T-0123)

## Upgrade notes

- No migration. Two new outbox channels, `opc.order-approval` and `opc.approval-notice`, are registered by Nitro plugins at startup.
- New API: `POST /api/admin/order-data`, which needs an admin session by cookie or `Authorization: Session <id>`. `GET /api/admin/orders` is unchanged.
- Orders left PENDING by earlier releases stay pending until an administrator decides them. Automatic approval applies only to newly stored orders.

## Known issues

- Customer approval e-mails are queued but not sent until the customer-notifications capability ships.
- A checkout with a blank e-mail leaves the order stuck and never stored (SWHR-T-0125). This predates this release, and a bugfix sprint is queued.

## Not included

Customer e-mail delivery, supplier fulfilment and invoicing are later capabilities.

## Verification

Verified at integration QA with a PASS verdict. All 53 order-approval scenarios pass, as do 899 unit and integration tests and 69 Chromium E2E tests. See [qa-test-report.md](qa-test-report.md).

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                  | Status    | Exception |
| ---------------------------- | --------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR-S-0012/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR-S-0012/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Known issues    | this file; sprint-summary.md §Open items  | Satisfied | —         |
