# PLAN — SWHR-T-0148: Stock update rules (task group 2)

Change: `swhr-i-0012-supplier-inventory`. Read its `design.md` §"Sprint planning — SWHR-S-0015" first. Requirements: **Stock update applies only to selected rows**, **Negative stock quantity is ignored per row**.

## Design reference

No design blocks apply: this ticket has no screen. The screens are SWHR-T-0152's (`artifacts/SWHR-S-0015/design/`).

## Objective

State the batch rule once, as a pure function the unit of work (SWHR-T-0149) and the route (SWHR-T-0150) call. No database access here.

## Steps

1. Read P2, SD-3, SD-4 and SD-5.
2. Write the tests first in `lib/supplier/stockBatch.test.ts`: the four SWHR-R-0225 scenarios titled SWHR-C-0393 to SWHR-C-0396, expressed as plans (for example, EST-3 ticked with "25" yields the update `{ EST-3, 25 }`; EST-4 unticked with "100" yields nothing). Add the rule cases: a ticked "-5" is skipped while a ticked "30" in the same batch applies (task 2.2); "abc" and "12.5" reject the batch as invalid; an unknown ticked item rejects it as unknown; an unticked row is never checked; surrounding spaces are trimmed.
3. Implement `planStockBatch` per P2. It is pure: the caller passes the known item ids.

## File/module ownership

- new `lib/supplier/stockBatch.ts`, `lib/supplier/stockBatch.test.ts`

## Definition of Done

AC-1 to AC-5 of the ticket.
