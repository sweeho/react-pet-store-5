# SWHR-T-0122 summary

Added `POST /api/admin/order-data`, dispatching on `type`: GETORDERS, UPDATESTATUS, REVENUE, ORDERS. Unknown and malformed requests get the fixed error texts from PLAN.md. `GET /api/admin/orders` is unchanged.

## Files

- `lib/auth/adminDataSession.ts`: cookie-or-`Session <id>` admin session check.
- `lib/orders/adminData.ts`: `listOrdersByStatus`, `queueDecisions`, `salesReport`, `parseReportDate` (drizzle only; revenue in hundredths).
- `routes/api/admin/order-data.post.ts`: route.
- `routes/api/admin/order-data.test.ts`: integration tests for SWHR-C-0292, 0294-0296, 0301, 0302, 0313-0319, plus 401, ja_JP and bad-date cases.

## AC coverage

All 13 ACs by the tests above, each titled with its case key.

## Notes

- No separate `adminData.test.ts`; the route tests exercise the lib through the real database.
- Statuses outside the five stored values in GETORDERS give a 400.

## Verification

- `bun run lint`, `bun run typecheck`: pass.
- `bun run test`: 851 passed, 0 failed.
- Platform red run abd56ce9-4a3c-4435-836b-ac256e27ea44 (valid); green run recorded after commit.
