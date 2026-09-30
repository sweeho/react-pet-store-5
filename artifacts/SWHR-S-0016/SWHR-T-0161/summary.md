# SWHR-T-0161 summary

Added the three `customer-notification` consumers (approval notice, shipment on invoice, completed order). Each renders with `renderCustomerEmail` and queues `enqueueMail` to the order's e-mail id; a switched-off kind returns a no-op commit, so the delivery is consumed silently. An unknown order throws `OrderNotFoundError` (delivery retries). An invoice matching no order line sends nothing. Order approval and fulfilment code is untouched. No UI built here.

Files: `lib/notifications/producers.ts` (+test), `plugins/customer-notification.ts` (registers the consumers after the switch check), `plugins/customer-notification.test.ts`.

AC coverage: approval single and batch (C-0001, C-0413), partial shipment (C-0414), completing invoice (C-0415), completed list (C-0416), shipment switch off (C-0418), ja_JP wording (C-0427), registration on three channels.

Verification: `bun run verify` exit 0, 1068 tests passed. Red run valid, green run recorded.
