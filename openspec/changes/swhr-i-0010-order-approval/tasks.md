## 1. Data model

- [x] 1.1 Add order status values PENDING, APPROVED, DENIED, COMPLETED to the Drizzle order schema and generate the migration (SWHR-T-0119)
- [x] 1.2 Add an approval-decision table (order id, decided status, created at, processed at) and generate the migration (SWHR-T-0119)
- [x] 1.3 Add per-locale auto-approval thresholds (en_US < 500, ja_JP < 50000, others none) as configuration (SWHR-T-0119)

## 2. Automatic approval

- [ ] 2.1 Implement the auto-approval check on order intake with strict less-than and no currency conversion (SWHR-T-0120)
- [ ] 2.2 Route auto-approvals through the same decision-processing path as administrator decisions (SWHR-T-0120)
- [ ] 2.3 Unit-test threshold boundaries for en_US, ja_JP and zh_CN (SWHR-T-0120)

## 3. Decision processing

- [ ] 3.1 Implement the decision processor that applies decisions only to PENDING orders, each independently, in one transaction per order (SWHR-T-0121)
- [ ] 3.2 Emit a supplier purchase order trigger for each approved order (SWHR-T-0121)
- [ ] 3.3 Emit one batched customer-notice trigger listing every order whose status changed (SWHR-T-0121)
- [ ] 3.4 Test duplicate and late decisions are ignored with no side effects (SWHR-T-0121)

## 4. Administrator API

- [ ] 4.1 Add a GET route listing orders by status with distinct orders, total count and M/D/YYYY dates (SWHR-T-0122)
- [ ] 4.2 Add a POST route accepting approve/deny decisions, validating the body, skipping entries without id or status, and returning success once persisted (SWHR-T-0122)
- [ ] 4.3 Add revenue and order-count report routes with inclusive date window and optional category grouping by item (SWHR-T-0122)
- [ ] 4.4 Reject unknown request shapes and malformed bodies with descriptive errors (SWHR-T-0122)
- [ ] 4.5 Restrict all administrator routes to the administrator role (SWHR-T-0122)
- [ ] 4.6 Integration-test each route with a real H3Event (SWHR-T-0122)

## 5. Administrator screens

- [ ] 5.1 Build the administrator landing page with launch and logout controls (SWHR-T-0123)
- [ ] 5.2 Build the order-management workspace with pending, non-pending and sales views plus Refresh, About and Exit (SWHR-T-0123)
- [ ] 5.3 Build the Process Pending Orders table with sortable columns and status colour cues (SWHR-T-0123)
- [ ] 5.4 Add status editing, Approve, Deny and Commit controls with approve and deny batches and empty-commit no-op (SWHR-T-0123)
- [ ] 5.5 Build the read-only View Non-Pending Orders table (SWHR-T-0123)
- [ ] 5.6 Build the sales view with pie and bar charts, date fields, Get Data and default range (SWHR-T-0123)
- [ ] 5.7 Validate report dates as MM/dd/yyyy and omit invalid report groups (SWHR-T-0123)
- [ ] 5.8 Add the uncommitted-changes refresh warning (SWHR-T-0123)
- [ ] 5.9 Add the busy state that disables actions and shows the retrieving/updating message (SWHR-T-0123)
- [ ] 5.10 Add the fatal server-error dialog that blocks further actions (SWHR-T-0123)
- [ ] 5.11 UI-test each screen (SWHR-T-0123)

## 6. End-to-end

- [ ] 6.1 Playwright spec: a pending order is approved, committed and appears in the non-pending view after processing (SWHR-T-0124)
- [ ] 6.2 Playwright spec: sales chart reloads for a new date range and rejects a malformed date (SWHR-T-0124)
