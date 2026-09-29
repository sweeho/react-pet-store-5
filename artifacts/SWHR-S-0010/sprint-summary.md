---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0010
idea: SWHR-I-0008
branch: vortex/sprint/swhr-s-0010-c3edd958
upstream:
  [
    artifacts/SWHR-S-0010/SPRINT-PLAN.md,
    artifacts/SWHR-S-0010/qa-test-report.md,
    artifacts/SWHR-S-0010/integration-test-result.md,
    artifacts/SWHR-S-0010/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0010/release-notes.md]
---

# Sprint summary — SWHR-S-0010

## Tickets

| Ticket      | Type  | Title                                                                                              | Outcome                                        |
| ----------- | ----- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| SWHR-T-0093 | TASK  | Sprint plan — SWHR-S-0010                                                                          | DONE                                           |
| SWHR-T-0094 | EPIC  | Shopping cart                                                                                      | DONE (rollup)                                  |
| SWHR-T-0095 | STORY | A shopper collects items in a session cart, changes quantities and sees the subtotal               | DONE (rollup)                                  |
| SWHR-T-0096 | TASK  | Cart data model: shared CartLine/CartView contract on the existing cartLines table                 | DONE (#67) — [summary](SWHR-T-0096/summary.md) |
| SWHR-T-0097 | TASK  | Cart service: add, remove, batch update, quantity parsing, count, read-time lines, subtotal, empty | DONE (#68) — [summary](SWHR-T-0097/summary.md) |
| SWHR-T-0098 | TASK  | Cart API routes: GET/PATCH /api/cart, POST /api/cart/items, DELETE /api/cart/items/:itemId         | DONE (#69) — [summary](SWHR-T-0098/summary.md) |
| SWHR-T-0099 | TASK  | Cart page: rows, Remove, Update Cart, total, Check Out, empty state and header count               | DONE (#70) — [summary](SWHR-T-0099/summary.md) |
| SWHR-T-0100 | TASK  | Cart scenario tests: route integration suite and Playwright journey                                | DONE (#71) — [summary](SWHR-T-0100/summary.md) |
| SWHR-T-0101 | TASK  | Integration QA report — SWHR-S-0010                                                                | DONE (#73), verdict PASS                       |
| SWHR-T-0102 | TASK  | Sprint close bundle — SWHR-S-0010                                                                  | this file                                      |

## What shipped

The sprint goal "SWHR-I-0008: Shopping cart" is met. Change `swhr-i-0008-shopping-cart` adds the `shopping-cart` capability; its scenarios merge into `openspec/specs/shopping-cart/` at close.

- **Contract.** `lib/cart/types.ts` publishes `CartLine` and `CartView` (lines, distinct-line count, subtotal, locale) and `emptyCartView`. The existing `cartLines` table already met the storage tasks, so there is no migration. (SWHR-T-0096)
- **Service** in `lib/cart/lines.ts`: add (re-add resets to 1), remove, batch update, quantity parsing (0, negative, non-numeric and decimal all remove the line), count of stored lines, `getCart` priced at read time at the list price in integer minor units, and `emptyCart(sessionId, tx?)` for checkout. Lines the catalogue cannot resolve drop out of the list and subtotal but still count. (SWHR-T-0097)
- **Routes.** `GET`/`PATCH /api/cart`, `POST /api/cart/items` and `DELETE /api/cart/items/:itemId` are ungated and all answer a `CartView`. (SWHR-T-0098)
- **Screen.** `/cart` is rebuilt from the sprint mockups: rows with a linked name, Remove, an editable quantity and the price, then Update Cart, Subtotal and Check Out. An empty cart shows only "Your Shopping Cart is Empty.". The header Cart link shows the distinct-item count and refreshes on add, remove and update. Copy is in all three locales. (SWHR-T-0099)
- **Coverage.** `routes/api/cart/scenarios.test.ts` covers sign-out, non-numeric quantity, price change and session isolation through the real handlers. `e2e/cart.spec.ts` runs the anonymous Remove, Update Cart and Check Out journey. (SWHR-T-0100)

## Divergence from plan

Each is recorded in its ticket summary:

- SWHR-T-0096 added `emptyCartView`, which the plan did not name, so its red run could fail on a stub.
- SWHR-T-0097 kept the legacy `{ lines }` route answer for one ticket so the old page kept working; SWHR-T-0098 replaced it as planned.
- SWHR-T-0098 changed `src/pages/cart.test.tsx`, outside its ownership map, because the response shape change broke its fixture.
- SWHR-T-0099 kept the page heading "Cart" because other e2e specs assert it, and derives the category line from `categoryId`, because `CartLine` carries no category name.
- SWHR-T-0100 could not produce a red run: the behaviour it tests was already delivered, and the platform rejected the red run. Its Check Out e2e case asserts `/signin`, because checkout is gated for an anonymous shopper.

## Verification

The verdict is PASS. `bun run verify` is green with 154 files and 763 tests. Chromium E2E passed 62 of 62 with none skipped, and ran natively this time, with no browser workaround, because SWHR-T-0072 was fixed in SWHR-S-0009. All 25 delta scenarios (SWHR-C-0232 to SWHR-C-0256) pass, and no integration defects were found. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Root docs

No root doc changed at close.

- **ARCHITECTURE.md** was updated by SWHR-T-0093 at planning: the `lib/cart/` line and the Key Decision "The cart is priced when it is read, never stored". What shipped matches both.
- **PRODUCT.md** is unchanged. Its capability map already lists `shopping-cart`, and its open questions already record that the re-add requirement owes a correction (see Known Issues).
- **DESIGN.md** is unchanged. The cart screen reuses existing tokens and patterns.
- **AGENTS.md** is human-authored and was not touched.

No dated Changelog entry was added, because no doc changed and the planning role forbids new changelog entries.

## Known Issues

- **Re-add resets to 1 instead of incrementing (SD-1).** The spec (SWHR-R-0135, case SWHR-C-0242) says re-adding an item resets its quantity to 1 and was built as written. PRODUCT.md decided behaviour 3 says it increments, and the decided behaviour wins. The requirement, its scenario, its test case and `addCartItem` need correcting together. Filed as SWHR-T-0103.
- **Order emptying verified at service level only (SD-5).** No order placement exists yet, so SWHR-C-0256 is tested through `emptyCart`. Checkout (swhr-i-0009) must call `emptyCart` inside its order transaction.
- **Header count has no scenario (SD-4).** The Cart badge is built and unit-tested but no requirement covers it.
- **Design fidelity not checked (unfiled).** QA did not compare the mockups pixel by pixel; the screens are asserted by page tests and the e2e journey.

## Retrospective

- **Went well:** a strict five-ticket chain (contract → service → routes → page → scenarios) ran in one pass with zero integration defects. Each ticket fixed the assertions its own change broke, so CI stayed green on every merge.
- **Went well:** E2E ran on every UI ticket and at QA without the browser workaround, the first sprint since SWHR-T-0072 was fixed. The SWHR-S-0008 retrospective's top item paid off.
- **Could improve:** a tests-only ticket (SWHR-T-0100) cannot pass the red phase once the behaviour is already built. Planning should fold scenario tests into the ticket that implements the behaviour, rather than a trailing tests ticket.
- **Could improve:** planning built to a spec that the PRD already said was wrong (SD-1), so a correction ticket is now owed. A known spec-versus-PRD contradiction should be put to a human before the sprint starts, not escalated alongside it.

## Compliance / Control Evidence

| Control                        | Evidence                                                       | Location                                                                                 | Status    | Exception                                   |
| ------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------- | ------------------------------------------- |
| Work planned before execution  | Change proposal, design, spec delta, tasks; per-ticket PLAN.md | `openspec/changes/swhr-i-0008-shopping-cart/` (archived at close), `SWHR-T-00xx/PLAN.md` | Satisfied | —                                           |
| Tests executed per ticket      | TDD result per ticket                                          | `artifacts/SWHR-S-0010/SWHR-T-0096` … `SWHR-T-0100/tdd-test-result.md`                   | Satisfied | SWHR-T-0100 red phase not achievable        |
| Change verified before release | QA report, PASS, 25/25 scenarios, 62/62 E2E                    | `artifacts/SWHR-S-0010/qa-test-report.md`                                                | Satisfied | —                                           |
| Defects dispositioned          | 0 integration defects                                          | `artifacts/SWHR-S-0010/integration-defects-resolution.md`                                | Satisfied | —                                           |
| Spec/PRD consistency           | SD-1 recorded; correction filed                                | `openspec/changes/swhr-i-0008-shopping-cart/design.md` §Spec discrepancies; SWHR-T-0103  | Partial   | Re-add rule contradicts PRD until corrected |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed`    | SWHR-T-0101                                                                              | Satisfied | Human approver: Not Provided                |
