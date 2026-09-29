---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0011
idea: SWHR-I-0009
branch: vortex/sprint/swhr-s-0011-b79928f1
upstream:
  [
    artifacts/SWHR-S-0011/SPRINT-PLAN.md,
    artifacts/SWHR-S-0011/qa-test-report.md,
    artifacts/SWHR-S-0011/integration-test-result.md,
    artifacts/SWHR-S-0011/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0011/release-notes.md]
---

# Sprint summary — SWHR-S-0011

## Tickets

| Ticket      | Type  | Title                                                                                              | Outcome                                        |
| ----------- | ----- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| SWHR-T-0104 | TASK  | Sprint plan — SWHR-S-0011                                                                          | DONE                                           |
| SWHR-T-0105 | EPIC  | Checkout and order placement                                                                       | DONE (rollup)                                  |
| SWHR-T-0106 | STORY | A signed-in shopper checks out the cart and gets an order number straight away                     | DONE (rollup)                                  |
| SWHR-T-0113 | TASK  | Encode the resolved open questions: order card from the account (OQ-1) and exact decimal money     | DONE (#74) — [summary](SWHR-T-0113/summary.md) |
| SWHR-T-0107 | TASK  | Checkout data model: counters, purchase order snapshot tables, order channel, persistPurchaseOrder | DONE (#75) — [summary](SWHR-T-0107/summary.md) |
| SWHR-T-0108 | TASK  | Identifier generation: per-prefix counters, atomic nextId joining the caller's transaction         | DONE (#76) — [summary](SWHR-T-0108/summary.md) |
| SWHR-T-0112 | TASK  | Error routing: failure kinds mapped to error screens, unmapped kinds answer 500                    | DONE (#77) — [summary](SWHR-T-0112/summary.md) |
| SWHR-T-0109 | TASK  | Order placement service and POST /api/orders                                                       | DONE (#78) — [summary](SWHR-T-0109/summary.md) |
| SWHR-T-0110 | TASK  | Asynchronous hand-off: order-intake consumer on opc.purchase-order                                 | DONE (#79) — [summary](SWHR-T-0110/summary.md) |
| SWHR-T-0111 | TASK  | Checkout screens: order information, order complete, Order Error, general error, E2E               | DONE (#80) — [summary](SWHR-T-0111/summary.md) |
| SWHR-T-0114 | TASK  | Integration QA report — SWHR-S-0011                                                                | DONE (#82), verdict PASS                       |
| SWHR-T-0115 | TASK  | Sprint close bundle — SWHR-S-0011                                                                  | this file                                      |

## What shipped

The sprint goal "SWHR-I-0009: Checkout and order placement" is met. Change `swhr-i-0009-checkout-and-order-placement` adds the `checkout` capability; its scenarios merge into `openspec/specs/` at close.

- **Helpers.** `lib/orders/money.ts` converts integer minor units to and from exact decimal strings for order documents. `lib/checkout/card.ts` builds the order card from the account's masked card. (SWHR-T-0113)
- **Data model.** Migration 0007 adds `counters`, `purchase_orders` (status default PENDING, five allowed values), `order_contacts`, `order_addresses`, `order_cards`, `order_lines`, and `lastOrderId`/`lastOrderEmail` on the session. The outbox gains channel `opc.purchase-order`. `persistPurchaseOrder` stores the snapshot once per order id. (SWHR-T-0107)
- **Order ids.** `nextId(prefix, tx?)` issues `1001` + counter value atomically, joining the caller's transaction. (SWHR-T-0108)
- **Error routing.** `Failure` kinds map to screens and statuses in one table; an unmapped failure answers 500 naming its kind. (SWHR-T-0112)
- **Placement.** `POST /api/orders` validates both contacts, rejects an empty cart, then in one transaction issues the id, enqueues the purchase-order XML, empties the cart and records the last order on the session. (SWHR-T-0109)
- **Intake.** The `order-intake` consumer, registered by a Nitro plugin, reads the document and stores the order in the dispatcher's transaction. (SWHR-T-0110)
- **Screens.** `/checkout`, `/order-complete`, `/order-error` and `/error`, built from the sprint mockups inside the site shell, with copy in en_US, ja_JP and zh_CN. `GET /api/orders/last` reads through `withReadTransaction`. `e2e/checkout.spec.ts` runs cart → pre-filled form → submit → re-submit. (SWHR-T-0111)

## Divergence from plan

The seven tasks ran in the planned order (design P9). Planning-time spec discrepancies SD-1 to SD-10 are recorded in the change's `design.md` §Spec discrepancies and were built as resolved there. Delivery deviations, each in its ticket summary:

- SWHR-T-0108: the concurrency case (SWHR-C-0278) serializes the two connections' calls instead of interleaving them. It still exercises the cross-connection lock on a file database.
- SWHR-T-0110: the intake plugin also registers under Vitest, unlike the dispatcher plugin, because registration starts no timer.
- SWHR-T-0111: `GET /api/orders/last` answers an empty `email` rather than 404 when the order has no address, and the order complete page then omits the e-mail sentence. The E2E account has no e-mail.
- SWHR-T-0113: no linked test cases, so no platform red/green run was recorded.

## Verification

The verdict is PASS. All 30 delta scenarios pass. Lint, typecheck, build and 821 unit tests are green, and Chromium E2E passed 64 of 64 with none skipped. No integration defects were found. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Root docs

No root doc changed at close.

- **ARCHITECTURE.md** was updated by SWHR-T-0104 at planning: the `lib/checkout/`, `lib/orders/` and `lib/ids/` lines, the order entities, the `opc.purchase-order` channel, and the Key Decisions "Checkout only enqueues; order intake stores" and "Error screens are chosen by failure kind". What shipped matches them.
- **PRODUCT.md** is unchanged. Its capability map already lists `checkout`, and its Open questions already record the two spec corrections owed (see Open items).
- **DESIGN.md** is unchanged. The four screens reuse existing tokens, the shell's error and empty frames, and existing form patterns.
- **AGENTS.md** is human-authored and was not touched.

No dated Changelog entry was added, because no doc changed and the planning role forbids new changelog entries.

## Open items

The sprint was not conditionally approved, so there is no Known Issues section. These items stay open after close:

- **Blank-field scenario versus decided behaviour (SD-1).** Scenario "A required shipping field is blank" says the telephone is reported as missing. The API reports it in the 400 body, and the screen shows the general error page as the PRD decides. PRD Open question 2 records that the spec correction is still owed.
- **Blank billing e-mail (SD-9).** When the billing e-mail is blank, the order uses the account e-mail. This is provisional, and the idea canvas lists it as an open question for a human.
- **Design fidelity not checked.** QA did not compare the four screens with the mockups pixel for pixel. Page tests and the E2E journey cover them.
- **Re-add rule (SWHR-T-0103).** This was carried from SWHR-S-0010 and is still in BACKLOG.

## Defects Raised

None. No DEFECT ticket was created between the sprint start (2026-09-29T18:30Z) and close.

## Retrospective

- **Went well:** the sprint had seven tasks in a strict chain, with two parallel at the end, and it reached QA with zero integration defects. Planning pinned every shared signature in `design.md` P2–P8, so no ticket had to renegotiate an interface.
- **Went well:** the SWHR-S-0010 lesson was applied. Scenario tests were folded into the ticket that implements each behaviour, and every behaviour ticket except SWHR-T-0113 recorded a platform red/green run.
- **Went well:** the ARCHITECTURE Key Decision "One outbox for every asynchronous hop" caught SD-3 at planning. It stopped a second queue from being built.
- **Could improve:** ten spec discrepancies were resolved by planning rather than by the spec. Two of them (SD-1, SD-9) still need a human. Spec corrections that the PRD already says are owed should be applied before the sprint that builds on them.
- **Could improve:** SWHR-T-0113 had no linked test cases, so its tests were never shown red. Helper tickets should get test cases linked at planning.

## Compliance / Control Evidence

| Control                        | Evidence                                                       | Location                                                                                                | Status    | Exception                                         |
| ------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------- |
| Work planned before execution  | Change proposal, design, spec delta, tasks; per-ticket PLAN.md | `openspec/changes/swhr-i-0009-checkout-and-order-placement/` (archived at close), `SWHR-T-01xx/PLAN.md` | Satisfied | —                                                 |
| Tests executed per ticket      | TDD result per ticket                                          | `artifacts/SWHR-S-0011/SWHR-T-0107` … `SWHR-T-0113/tdd-test-result.md`                                  | Satisfied | SWHR-T-0113 has no platform red run               |
| Change verified before release | QA report, PASS, 30/30 scenarios, 64/64 E2E                    | `artifacts/SWHR-S-0011/qa-test-report.md`                                                               | Satisfied | —                                                 |
| Defects dispositioned          | 0 integration defects, 0 defects raised                        | `artifacts/SWHR-S-0011/integration-defects-resolution.md`                                               | Satisfied | —                                                 |
| Spec/PRD consistency           | SD-1 to SD-10 recorded with resolutions                        | `openspec/changes/swhr-i-0009-checkout-and-order-placement/design.md` §Spec discrepancies               | Partial   | SD-1 correction owed; SD-9 needs a human decision |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed`    | SWHR-T-0114                                                                                             | Satisfied | Human approver: Not Provided                      |
