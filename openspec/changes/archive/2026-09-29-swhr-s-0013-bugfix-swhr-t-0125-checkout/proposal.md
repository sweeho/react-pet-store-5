# Proposal — swhr-s-0013-bugfix-swhr-t-0125-checkout

## Why

**SWHR-T-0125 — an order with no e-mail is confirmed but never stored.** The steps below were reproduced or re-verified on the sprint base `bdb477a`.

- Registration does not require an e-mail (`lib/account/form.ts` REQUIRED omits it), so an account with no e-mail is a normal state.
- Checkout treats e-mail as optional in both sections (`lib/checkout/contact.ts` REQUIRED omits it; spec SWHR-R-0147).
- `placeOrder` resolves the order e-mail as `billing.email || account.contactInfo.email` (`lib/checkout/placeOrder.ts:36`) and never checks the result. When both are blank, it enqueues a PurchaseOrder whose `EmailId` is empty, empties the cart and answers success. The shopper sees "Your Order is Complete".
- The `order-intake` consumer reads that document with `reader.text("EmailId")` (`lib/b2b/documents/purchaseOrderV1.ts:79`), and that call rejects empty content (`lib/b2b/xml/read.ts:37`).

Reproduced: `writePurchaseOrder` with `emailId: ""` emits `<EmailId/>`, and `readPurchaseOrder` of that XML throws `EmailId element: content expected.`

The ticket says the message is "retried forever". It is not. The dispatcher retries it until `OUTBOX_MAX_ATTEMPTS` (default 10) and then marks the delivery `dead` (`lib/messaging/dispatcher.ts`). Either way the order is never stored.

The existing E2E case SWHR-C-0265 (`e2e/checkout.spec.ts`) submits checkout for an account with no e-mail, so it passes only because of this defect.

## What Changes

- Order placement rejects an order whose resolved contact e-mail is blank, before any id is issued or anything is queued. The billing e-mail is used when present, and the account's e-mail otherwise. The rejection is the existing missing-form-data failure naming `billing.email`, which shows the general error page like any other missing required field.
- The order information screen does not change. Per section, e-mail stays optional, and a blank billing e-mail still falls back to the account's e-mail.

## Impact

- Capability: **checkout**. SWHR-R-0147 "Required billing and shipping contact fields" gains a regression scenario.
- Code: `lib/checkout/placeOrder.ts`, `routes/api/orders/index.test.ts`, `e2e/checkout.spec.ts`. No migration, no API shape change, no UI change.
- Orders already placed with a blank e-mail stay as `dead` deliveries on `opc.purchase-order`. This change does not repair them (F1).

## Follow-ups / out of scope

- **F1: stranded orders.** Any order placed before this fix with no e-mail sits as a `dead` `opc.purchase-order` delivery, and the shopper saw a confirmation for it. Finding and resolving those orders is operational data repair, not a code change. Not filed: planning has no defect authority.
- **F2: E2E accounts have no e-mail.** `completeAccountForm` in `e2e/account-helpers.ts` never fills an e-mail, so any future checkout journey must fill the billing e-mail itself. Adding an e-mail to the helper would be simpler once SWHR-S-0012 has landed on `dev`. Not filed.
