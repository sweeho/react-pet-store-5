## Context

Source: 36 ingested IR records (63 pass records across two passes) under `capability_key: order-approval`, drawn from `docs/using.html`, `src/apps/admin` (landing JSP, request-processor servlet, Swing Web Start client), `src/apps/opc` (order-processing MDBs and the admin facade EJB), and the `asyncsender`, `processmanager`, `purchaseorder` and `xmldocuments` components. Paths below are relative to `legacy-source/petstore1.3.2/`.

Legacy flow:

1. `PurchaseOrderMDB` (`src/apps/opc/.../ejb/PurchaseOrderMDB.java:151-191`) persists an incoming order and calls `canIApprove()`. If it returns true, it builds an `OrderApproval` containing one APPROVED `ChangedOrder` and sends it to `jms/opc/OrderApprovalQueue`; otherwise nothing is sent and the order sits in PENDING.
2. The administrator signs in (`src/apps/admin/src/docroot/WEB-INF/web.xml:75-101`, role `administrator`), sees `index.jsp`, and launches the Swing client via Java Web Start.
3. The client talks XML-over-HTTP POST to `ApplRequestProcessor` (`src/apps/admin/.../web/ApplRequestProcessor.java:122-326`) with request types GETORDERS, UPDATESTATUS, REVENUE, ORDERS. That servlet calls the remote `OPCAdminFacadeEJB` for reads, and for UPDATESTATUS serialises an `OrderApproval` document and sends it through `AsyncSenderEJB`, whose queue reference the admin app binds to `jms/opc/OrderApprovalQueue` (`src/apps/admin/src/sun-j2ee-ri.xml:95-98`). It replies SUCCESS as soon as the message is sent.
4. `OrderApprovalMDB` (`src/apps/opc/.../ejb/OrderApprovalMDB.java:185-240`) processes each `ChangedOrder`, skips any whose current status is not PENDING, updates status in the process manager, builds a supplier PO for APPROVED orders, and `OrderApprovalTD` sends each PO to `jms/supplier/PurchaseOrderQueue` and one batched message to the mail-approval queue.

Client structure: `PetStoreAdminClient` (frame, refresh on start), `DataSource` (table models, `RefreshAction`, `commit()`, `ChartModel`, `fatalServerError`), `OrdersApprovePanel` / `OrdersViewPanel`, `PieChartPanel` / `BarChartPanel`, `HttpPostPetStoreProxy` (wire format). All visible strings are in `src/apps/admin/src/client/resources/petstore.properties`.

## Goals / Non-Goals

**Goals**

- Rebuild the approval decision, review workflow, decision delivery and administrator reports on the pinned stack (Vite React SPA + Nitro/H3 + SQLite/Drizzle).
- Replace the Swing Web Start client with SPA pages that honour the screen requirements in `specs/order-approval/spec.md`.

**Non-Goals**

- Administrator authentication itself (owned by `sign-on`).
- Supplier fulfilment and the content of customer emails (owned by the fulfilment and notification capabilities); this change only emits the triggers.
- Reproducing JMS, XML/DTD wire formats or Java Web Start.

## Decisions

- **D1 Threshold follows the code, not the guide.** `using.html:201-240` states one $500 threshold and is silent on exactly $500. `PurchaseOrderMDB.canIApprove()` (lines 183-191) uses strict `<` against 500 for `Locale.US`, 50000 for `Locale.JAPAN`, and returns false for every other locale including zh_CN, which the storefront otherwise supports. The spec states the code behaviour. Confidence is low (bare literals, no configuration). Recommend making the thresholds per-locale configuration in the rebuild; whether zh_CN should ever auto-approve needs a product decision.
- **D2 Queue replaced by a durable job.** JMS decoupling becomes a persisted "approval decision" record processed by a Nitro task or in-process worker; the success-on-enqueue semantics are preserved (the API returns once decisions are persisted, before they are applied).
- **D3 Idempotency guard kept.** The PENDING-only guard in `OrderApprovalMDB` is what makes duplicate or late decisions safe (an auto-approved order later denied by an admin is ignored). It must stay a server-side check inside the same transaction as the status update.
- **D4 Approve and deny batches.** The client sends APPROVED rows then DENIED rows as two `UPDATESTATUS` calls (`DataSource.java:422-498`). The rebuild MAY send one request carrying both, as long as the two outcome groups are distinguishable and an empty commit sends nothing.
- **D5 Wire document validation.** The DTD (`src/components/xmldocuments/src/rsrc/schemas/OrderApproval.dtd:38-45`) requires at least one order, each with id then status. In the rebuild this becomes request-body schema validation on the decisions endpoint; the "skip entries lacking id or status" rule in `ApplRequestProcessor.updateOrders` (lines 212-224) applies before the document is built, so an all-invalid submission produces nothing to queue.
- **D6 Fatal error behaviour.** The legacy client calls `System.exit(1)` after the "Fatal Error!" dialog. The spec keeps "end the session"; in a SPA that should mean showing the error and blocking further actions until reload, not closing the tab.

## Risks / Trade-offs

- **R1 Date format mismatch.** `OPCAdminFacadeEJB.getOrdersByStatus` formats dates as `month/day/year` without padding (`getMonth()+1`, `getDate()`, `getYear()+1900`), while the client parses with `MM/dd/yyyy` (lenient `SimpleDateFormat`, so it works). The spec follows the server output (M/D/YYYY). Flag for a human if a padded format is preferred.
- **R2 Reports ignore status.** `getChartInfo` (`OPCAdminFacadeEJB.java:159-256`) counts every order in the window, including DENIED ones, so "revenue" includes revenue that was never taken. Stated as-is; likely unintended.
- **R3 "Order count" counts quantities.** The ORDERS report sums line quantities, not orders, although the chart describes it as "total # of sales per category". The spec states the arithmetic; the label is legacy copy.
- **R4 Revenue precision.** Revenue is summed in single-precision `float`. The rebuild should use integer minor units or decimal arithmetic; totals may differ from the legacy by rounding.
- **R5 Legacy default date range** (1/1/2001 to 12/31/2002, `DataSource.java:522-531`) is a demo artefact; stated as SHOULD. A rolling default is likely more useful.
- **R6 Success before application.** The administrator sees success before orders change; a refresh immediately after commit may still show orders as pending.

## Legacy screen notes

- Landing page: `src/apps/admin/src/docroot/index.jsp:61-82`; two POST forms to `AdminRequestProcessor` with `currentScreen=manageorders` and `currentScreen=logout`.
- Pending view: `OrdersApprovePanel.java:80-171` (status editor combo, Approve/Deny apply to `getSelectedRows()`, `TableSorter` header sorting, colour renderer); editability in `DataSource.java:500-507` (column 4 only).
- Non-pending view: `OrdersViewPanel.java:47-77`, `DataSource.java:291-305, 402-407`.
- Sales view: `PieChartPanel.java:111-210`, `BarChartPanel.java:102-124`; pie/bar selector strings `SalesPanelComboBox.*`.
- Busy state: `DISABLE_ACTIONS` / `ENABLE_ACTIONS` property events (`PetStoreAdminClient.java:307-319`, `OrdersApprovePanel.java:191-199`).

Screen records to requirement mapping (10 pass records, 7 requirements): landing page (admin b SCREEN-0001); client workspace (docs b SCREEN-0001, docs a SCR-0003 two-pane part); pending display (admin a SCR-0008); pending decisions (admin b SCREEN-0006); non-pending view (admin a SCR-0009, admin b SCREEN-0005, docs c SCREEN-0001); sales charts (admin b SCREEN-0016); order-row display (opc b SCREEN-0001).

## Migration Plan

Legacy statuses map one-to-one to the new status column. Orders PENDING at cut-over remain PENDING and appear in the new pending view; no in-flight queue messages should exist if the legacy queues are drained before cut-over.

## Open Questions

- **Q1** Should zh_CN (and any future locale) have an auto-approval threshold? (D1)
- **Q2** Should reports exclude DENIED orders? (R2)
- **Q3** Should the order-count report count orders rather than quantities? (R3)
