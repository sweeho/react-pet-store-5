---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0003
idea: SWHR-I-0004
branch: vortex/sprint/swhr-s-0003-6b5b7d75
upstream: [artifacts/SWHR-S-0003/qa-test-report.md]
---

# Release notes — SWHR-S-0003

## Added

- Purchase orders and the internal supplier order can be written and read in the version 1.1 document format. Dates are year-month-day, and a missing or unparseable order date falls back to today. (SWHR-T-0029, SWHR-T-0030)
- Legacy version 1.0 purchase orders can be read. Their language defaults to US English. (SWHR-T-0032)
- Supplier orders and invoices can be built and read in the published trading-partner format. The second street line and payment details are not sent to the supplier. (SWHR-T-0031)
- Bad documents are rejected with a clear reason, such as `PurchaseOrder element expected.`, `City element: content expected.` or `Document not of type`. Examples include a malformed document, the wrong document type, a missing required value, a zero quantity or a duplicate item. When validation is on, an invalid supplier order is not recorded. (SWHR-T-0028–SWHR-T-0031)
- Documents are UTF-8, and prices are exact decimals. (SWHR-T-0028, SWHR-T-0033)
- Each approved order becomes one message to the supplier. The supplier records the order and sends its invoice as one step: if either fails, both are undone and retried later. Each invoice goes to order fulfilment and customer notification separately. (SWHR-T-0033)
- The order centre publishes its schema catalog at `GET /api/b2b/entity-catalog` and each schema at `GET /api/b2b/schemas/:file`. (SWHR-T-0028)

## Upgrade notes

- New database migration `drizzle/0003_wet_boomer.sql` adds the supplier order tables (`supplier_orders`, `supplier_contacts`, `supplier_addresses`, `supplier_line_items`) and the outbox (`outbox_messages`, `outbox_deliveries`). It applies automatically at startup.
- New dependencies: `@xmldom/xmldom` and `xmllint-wasm`.
- A server plugin now polls the outbox every second. New optional settings:
  - `OUTBOX_POLL_MS` — poll interval, default 1000.
  - `OUTBOX_MAX_ATTEMPTS` — retries before a delivery is marked `dead`, default 10.
  - `B2B_VALIDATE_PURCHASE_ORDER`, `B2B_VALIDATE_ORDER_APPROVAL`, `B2B_VALIDATE_INVOICE`, `B2B_VALIDATE_SUPPLIER_ORDER` — set to `false` to switch validation off for that document. All are on by default.
  - `B2B_SCHEMA_FORM` — `dtd` (default) or `xsd`.
  - `B2B_ENTITY_CATALOG` — path to a deployment catalog that overrides the bundled schema locations.

## Not included

- Nothing sends orders to the supplier yet. Order approval (SWHR-I-0010) will call the new supplier channel, and order fulfilment and customer e-mails (SWHR-I-0011, SWHR-I-0013) will consume invoices.
- There is no XML-over-HTTP intake. Documents move only through the internal outbox.
- Five rulings are pending in SWHR-T-0035, including whether version 1.0 is still needed and whether the supplier is external or in-process. The version 1.0 address element names are a reconstruction.

## Verification

Verified at integration QA: 52/52 scenarios, 328 unit tests and 28/28 E2E tests pass. See [qa-test-report.md](qa-test-report.md) (PASS).

## Compliance / Control Evidence

| Control                      | Evidence             | Location                                  | Status    | Exception |
| ---------------------------- | -------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file            | `artifacts/SWHR-S-0003/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict      | `artifacts/SWHR-S-0003/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Not included section | this file; SWHR-T-0035                    | Satisfied | —         |
