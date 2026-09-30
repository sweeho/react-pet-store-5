# PLAN — SWHR-T-0161: Notification producers (task group 4)

Change: `swhr-i-0013-customer-notifications`. Read its `design.md` §"Sprint planning — SWHR-S-0016" first (P5, SD-5, SD-7, SD-10). Requirements: **Order approval decision notification**, **Shipment notification**, **Order completed notification**, **Independently switchable notification kinds** and **Notifications rendered in the order's locale**.

## Design reference

No design blocks are built here: the producers call `renderCustomerEmail` from SWHR-T-0159, which owns the designs (`artifacts/SWHR-S-0016/design/`).

## Objective

Turn each approval batch, invoice and completion already on the outbox into queued customer e-mails, per the switches, without touching order processing.

## Steps

1. Write `lib/notifications/producers.test.ts` first. Use the in-memory database, orders stored through the order-intake path as in `lib/b2b/scenarios/order-fulfillment.test.ts`, the real consumers registered, and a capturing `MailTransport` behind `createMailerHandler`. Deliver with `dispatchPending`, then run the mail channel.
   - SWHR-C-0001: one e-mail with subject `Java Pet Store Order Status: 1001` to `ann@example.com`, stating approval.
   - SWHR-C-0413: a batch approving 1001 and denying 1002 gives two e-mails, each to its own order's address with its own decision.
   - SWHR-C-0414: an invoice for two of three lines gives one e-mail with subject `Java Pet Store Order Shipped: 1001` listing only those two.
   - SWHR-C-0415: a completing invoice gives a shipment e-mail and a separate COMPLETED e-mail.
   - SWHR-C-0416: completion lists all three lines under subject `Java Pet Store Order COMPLETED: 1001`.
   - SWHR-C-0418: with shipment off, no shipment e-mail is sent, the invoice is still applied (shipped quantities and status), and the approval and completed e-mails still arrive.
   - SWHR-C-0427: the shipment e-mail for ja_JP order 1003 uses the Japanese template.
   - Also cover: an invoice naming no order line sends nothing, and an unknown order leaves its delivery to retry.
2. Implement `lib/notifications/producers.ts` per P5. Use `getStoredOrder`, `minorToDecimal` for unit prices, `readOrderApproval` and `readPartnerInvoice`.
3. Extend `plugins/customer-notification.ts` to register the three handlers as `customer-notification` on `opc.approval-notice`, `opc.invoice` and `opc.completed-order`, with the switches it already loads. Extend its test to assert all three registrations.

## File/module ownership

- new `lib/notifications/producers.ts`, `lib/notifications/producers.test.ts`
- modify `plugins/customer-notification.ts`, `plugins/customer-notification.test.ts` (created by SWHR-T-0158)

## Definition of Done

AC-1 to AC-9 of the ticket.
