---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0012
ticket: SWHR-T-0123
branch: vortex/sprint/swhr-s-0012-057cab7b
upstream:
  [openspec/changes/swhr-i-0010-order-approval/design.md, artifacts/SWHR-S-0012/design/MANIFEST.md]
downstream:
  [
    artifacts/SWHR-S-0012/SWHR-T-0123/tdd-test-result.md,
    artifacts/SWHR-S-0012/SWHR-T-0123/summary.md,
  ]
---

# PLAN — SWHR-T-0123: Administrator screens

Change: `swhr-i-0010-order-approval` · Tasks group 5 · Requirements: **Order summary for administrator review** (client side), **Order data loaded on start and refresh**, **Decisions take effect only on commit**, **Warning on refresh with uncommitted changes**, **Busy state during server requests**, **Server failure in the administrator client**, **Report date entry validation**, **Default report date range**, **Invalid report groups omitted**, **Administrator landing page**, **Order-management client workspace**, **Process Pending Orders display**, **Process Pending Orders decisions**, **View Non-Pending Orders display**, **Sales charts view**, **Order row date and amount display**

## Design reference

Build what these show: layout, spacing, hierarchy and states. Use tokens, never the mockups' hex values (DESIGN.md §Tokens, §Status colours, §Dialogs, §Charts). Index: `artifacts/SWHR-S-0012/design/MANIFEST.md`.

- `artifacts/SWHR-S-0012/design/mockup-administrator-landing-page.html`: `/admin/console`
- `artifacts/SWHR-S-0012/design/mockup-admin-order-review-process-pending-order.html`: `/admin/orders`, Orders tab, pending view
- `artifacts/SWHR-S-0012/design/mockup-process-pending-orders-discard-uncommitt.html`: the refresh warning modal
- `artifacts/SWHR-S-0012/design/mockup-admin-order-review-view-non-pending-orde.html`: the non-pending view
- `artifacts/SWHR-S-0012/design/mockup-admin-sales-reporting.html`: the Sales tab
- The `wireframe-*.html` files with the same names show structure only.

## Objective

Replace the placeholder console with the administrator landing page, and add the `/admin/orders` order-management workspace. It has pending and non-pending order tables, commit batching, the sales charts, and the busy, refresh-warning and fatal-error states, all driven by `POST /api/admin/order-data`.

## Steps

1. Read `openspec/changes/swhr-i-0010-order-approval/design.md`, first §Legacy screen notes, D4, D6 and R5, then §Sprint planning P6 (the API contract), P7, and SD-9 and SD-11.
2. Add `src/components/admin/orderData.ts` with the pure helpers listed in P7, and `orderData.test.ts`.
3. Add `src/components/admin/OrderTable.tsx`: sortable headers (numeric for Amount), row checkboxes, a status badge coloured per DESIGN.md §Status colours, a Status select only when `editable`, and all other cells as plain text.
4. Add `src/components/admin/SalesCharts.tsx`:
   - a Pie Chart / Bar Chart selector with the spec's titles and captions
   - Start Date and End Date inputs defaulting to 01/01/2001 and 12/31/2002
   - Get Data, which validates both dates first
   - SVG pie slices with percentages, and SVG bars, both in `chart-*` tokens
5. Add `src/components/admin/ConfirmDialog.tsx` and `FatalErrorDialog.tsx` on `@headlessui/react` `Dialog` (DESIGN.md §Dialogs).
6. Add `src/pages/admin/orders.tsx`, the workspace (P7):
   - Gating is the same as the console: `GET /api/staff/session?realm=admin`.
   - Load on mount and on Refresh.
   - Approve and Deny act on the selected rows; per-row edits are allowed.
   - Commit sends two batches (`commitBatches`).
   - The refresh warning appears only when there are marks.
   - The busy message and disabled controls show while a request is in flight.
   - Any failure opens Fatal Error, after which everything stays disabled.
   - About opens a dialog. Exit discards marks and goes to `/admin/console`.
7. Rewrite `src/pages/admin/console.tsx` as the landing page (P7):
   - Keep the redirect, access-refused and sign-out behaviour.
   - "Launch Rich Client" calls `/api/admin/launch`, then navigates to `/admin/orders`.
   - The button reads "logout" (SD-9).
     Update `console.test.tsx` (C-0138 and C-0139 keep passing), and update the heading assertion in `e2e/sign-on.spec.ts` to the new heading.
8. Add the admin copy to `src/i18n/admin/{types,en,de}.ts`. German may reuse the English legacy strings where no translation exists, as the file does today.
9. Tests with fetch stubbed, as in `console.test.tsx`:
   - `orderData.test.ts`: [SWHR-C-0293] and [SWHR-C-0322].
   - `src/pages/admin/orders.test.tsx`: [SWHR-C-0297], [SWHR-C-0298], [SWHR-C-0299], [SWHR-C-0309], [SWHR-C-0310], [SWHR-C-0311], [SWHR-C-0312], [SWHR-C-0326], [SWHR-C-0328], [SWHR-C-0329], [SWHR-C-0330], [SWHR-C-0331], [SWHR-C-0332], [SWHR-C-0333], [SWHR-C-0334], [SWHR-C-0335], [SWHR-C-0336] and [SWHR-C-0339].
   - `SalesCharts.test.tsx`: [SWHR-C-0320], [SWHR-C-0321], [SWHR-C-0337] and [SWHR-C-0338].
   - `console.test.tsx`: [SWHR-C-0323].
   - Colour assertions check the badge's status class, not computed colour.

## File/module ownership

- `src/components/admin/*` (new: `orderData.ts`, `OrderTable.tsx`, `SalesCharts.tsx`, `ConfirmDialog.tsx`, `FatalErrorDialog.tsx`, and their tests)
- `src/pages/admin/orders.tsx`, `src/pages/admin/orders.test.tsx` (new)
- `src/pages/admin/console.tsx`, `src/pages/admin/console.test.tsx`
- `src/i18n/admin/types.ts`, `src/i18n/admin/en.ts`, `src/i18n/admin/de.ts`
- `e2e/sign-on.spec.ts` (the console heading assertion only)

Consumes unchanged: the P6 request and response JSON from SWHR-T-0122, `GET /api/staff/session`, `POST /api/staff/signoff`, `GET /api/admin/launch`, and the shared `ErrorState` and `Button`. Fixed interface for SWHR-T-0124: the routes `/admin/console` and `/admin/orders`, the button names "Launch Rich Client", "logout", "Refresh", "About", "Exit", "Approve", "Deny", "Commit" and "Get Data", the tab names "Process Pending Orders", "View Non-Pending Orders" and "Sales", and the modal texts in P7.

## Definition of Done

AC-1 to AC-25 by the tests above, each titled with its case key. The screens match the five mockups at 1440 px inside the site shell.
