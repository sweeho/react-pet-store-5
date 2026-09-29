---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0012
ticket: SWHR-T-0124
branch: vortex/sprint/swhr-s-0012-057cab7b
upstream:
  [openspec/changes/swhr-i-0010-order-approval/design.md, artifacts/SWHR-S-0012/design/MANIFEST.md]
downstream:
  [
    artifacts/SWHR-S-0012/SWHR-T-0124/tdd-test-result.md,
    artifacts/SWHR-S-0012/SWHR-T-0124/summary.md,
  ]
---

# PLAN — SWHR-T-0124: End-to-end order approval

Change: `swhr-i-0010-order-approval` · Tasks group 6 · Requirements: **Decisions take effect only on commit** (SWHR-R-0170.03), **Administrator landing page** (R-0185.02, R-0185.03), **Order-management client workspace** (R-0186.02)

## Design reference

The journeys run across the screens in `artifacts/SWHR-S-0012/design/` (index `MANIFEST.md`). Assert on the roles and names fixed in SWHR-T-0123's PLAN, not on layout.

## Objective

Prove the whole flow in a real browser against the real server and dispatcher. A zh_CN order waits as PENDING, an administrator approves it and commits, and after processing it shows among non-pending orders. Also cover the landing controls, Exit without commit, and the sales date range.

## Steps

1. Read `openspec/changes/swhr-i-0010-order-approval/design.md` §Sprint planning P7, P8 and P9, and `e2e/checkout.spec.ts` for placing an order, plus `e2e/sign-on.spec.ts` for staff sign-in.
2. Write `e2e/order-approval.spec.ts`. Place orders through the storefront (switch to 中文 for zh_CN, so the order stays PENDING), then:
   - [SWHR-C-0324] "Launch Rich Client" on `/admin/console` opens `/admin/orders`, titled "Pet Store Administration".
   - [SWHR-C-0325] "logout" signs out; `/admin/console` then goes to `/admin/signin`.
   - [SWHR-C-0300] Mark the order APPROVED, then Exit and launch again: it is still PENDING.
   - [SWHR-C-0327] Approve, Commit, then Refresh (poll with `expect.poll` or `toPass` while the dispatcher runs): it leaves Process Pending Orders and appears in View Non-Pending Orders as APPROVED.
   - Task 6.2: Sales, Bar Chart, with a range covering today: Get Data redraws with the placed items' category. Then "2001-01-01" shows "Dates must be in the format of MM/dd/yyyy".
3. If placing orders repeats `checkout.spec.ts` steps, move the shared steps into `e2e/account-helpers.ts` without changing the existing specs' behaviour.

## File/module ownership

- `e2e/order-approval.spec.ts` (new)
- `e2e/account-helpers.ts` (additions only)

## Definition of Done

AC-1 to AC-4 by the spec's tests, each titled with its case key. The spec has been run, and it passes alongside the existing E2E suite.
