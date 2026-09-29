# Design — swhr-s-0013-bugfix-swhr-t-0125-checkout

## Context

The root cause is in `proposal.md` §Why. The purchase-order document requires a non-empty `EmailId`, and the strict reader is correct to enforce that. The gap is that placement never guarantees one.

## Decisions

### D1 — Reject at placement, not relax intake

`placeOrder` checks the resolved e-mail after `validateOrderContacts` and before `db.transaction`. When it is blank, it throws `new MissingFormDataFailure(["billing.email"])`.

Rejected alternative: reading `EmailId` with `allowEmpty` in intake. That would store an order with no address for the approval, shipment and completion e-mails, and a confirmation page with nowhere to send them. It would also loosen the document's reader, which the partner document exchange shares.

### D2 — Reuse the existing failure and screen

`MissingFormDataFailure` already maps to `/error` with status 400 and lists `missing` in the body (`lib/errors/routing.ts`). This is the decided behaviour for every blank required field (PRD decided behaviour; checkout SD-1 of SWHR-S-0011). No new failure kind, route, i18n string or screen is added. Field-level reporting stays out of scope.

### D3 — The account-e-mail fallback is unchanged

`billing.email || account.contactInfo.email` stays as it is. The fallback is provisional (SWHR-S-0011 SD-9, an open product question), so this change neither codifies it in the spec nor removes it. The check applies to the resolved value only. A blank shipping e-mail stays valid (SWHR-R-0147.02).

### D4 — Tests

- Route test in `routes/api/orders/index.test.ts`, titled with the new scenario. The account and the billing e-mail are both blank. It asserts status 400, `missing` equal to `["billing.email"]`, no `opc.purchase-order` message, the cart unchanged and the order counter not advanced.
- A second route case: the billing e-mail is blank and the account has one. It asserts the queued document's `emailId` is the account e-mail. This guards D3 without making it a spec requirement.
- `e2e/checkout.spec.ts` SWHR-C-0265 fills the Billing Information e-mail input before its first Submit, because its account has no e-mail. `e2e/account-helpers.ts` is not edited, because SWHR-S-0012 changes it and has not landed on `dev` yet.
