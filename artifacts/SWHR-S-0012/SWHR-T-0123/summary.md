# Summary — SWHR-T-0123

Built the administrator screens from the sprint mockups. `/admin/console` is now the landing page (text, "Launch Rich Client" which opens `/admin/orders`, "logout", workspace cards, auto-approval note), keeping the sign-on gating. `/admin/orders` is the "Pet Store Administration" workspace: Refresh, About, Exit; sortable Process Pending Orders table with status badges, per-row Status select, Approve/Deny on selected rows, Commit as an approval batch then a denial batch; read-only View Non-Pending Orders; Sales pie and bar charts with MM/dd/yyyy validation and the 01/01/2001–12/31/2002 default. It also has the busy message, refresh-discard warning and Fatal Error dialog (all actions stay disabled; its only action signs out).

Files: `src/components/admin/{orderData.ts,OrderTable.tsx,SalesCharts.tsx,ConfirmDialog.tsx,FatalErrorDialog.tsx}` and tests; `src/pages/admin/{orders.tsx,console.tsx}` and tests; `src/i18n/admin/{types,en,de}.ts` (console keys renamed: `launchClientButton`, `logoutButton`); `e2e/sign-on.spec.ts` (heading only).

Deviations: chart series start at `chart-primary` then `chart-5`, `-6`, `-7`, `-3`, `-4`, since `chart-1`/`chart-2` are near-white tints. Non-pending mockup's "Showing 9 of 18 … scroll" footer shows the plain count instead.

AC coverage: all 25 linked cases pass (green run f3b96065). Verification: `bun run verify` exit 0 (880 tests); `bun run test:e2e -- e2e/sign-on.spec.ts` 8 passed. The new order-approval e2e is SWHR-T-0124.
