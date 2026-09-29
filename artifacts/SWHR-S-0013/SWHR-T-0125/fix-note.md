# Fix note — SWHR-T-0125

## Root cause

`placeOrder` resolved `billing.email || account.contactInfo.email` without checking the result. With both blank it queued a PurchaseOrder with an empty `EmailId`, which the strict reader in order-intake rejects on every delivery, so the order was never stored.

## Fix

After the e-mail is resolved and before the transaction, `placeOrder` throws `MissingFormDataFailure(["billing.email"])` when it is blank (400, `/error`). Fallback and signature unchanged.

## Files

- `lib/checkout/placeOrder.ts` — the guard.
- `routes/api/orders/index.test.ts` — SWHR-C-0460 regression plus an account-e-mail fallback case; `signIn` takes an optional account e-mail.
- `e2e/checkout.spec.ts` — SWHR-C-0265 fills the billing e-mail (its account has none).
