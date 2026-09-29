## 1. Every placed order carries a contact e-mail

- [ ] 1.1 Reject a blank resolved e-mail in `placeOrder` with `MissingFormDataFailure(["billing.email"])` before the transaction (SWHR-T-0125)
- [ ] 1.2 Route tests for the no-e-mail scenario and the account-e-mail fallback in `routes/api/orders/index.test.ts` (SWHR-T-0125)
- [ ] 1.3 Fill the billing e-mail in `e2e/checkout.spec.ts` SWHR-C-0265, whose account has no e-mail (SWHR-T-0125)
