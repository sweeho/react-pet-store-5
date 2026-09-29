# SWHR-T-0082 — Account server routes and validation

Change `swhr-i-0007-customer-account-and-profile`, tasks.md group 3. Read `openspec/changes/swhr-i-0007-customer-account-and-profile/design.md` §Sprint planning first (P3, P6, P8, P9). Depends on SWHR-T-0081.

## Objective

The signed-on shopper creates their account once at registration, reads it and replaces it. The server validates every submission, and the user id always comes from the session.

## Design reference

No UI. Field names follow the create-form mockup `artifacts/SWHR-S-0008/design/mockup-create-account-account-information-form-.html`.

## Steps

1. `lib/account/form.ts` (new, P6): trim every string; collect all missing required fields (`familyName`, `givenName`, `streetName1`, `city`, `state`, `zipCode`, `telephone`, `cardNumber` on create only, `cardType`, `expiryMonth`, `expiryYear`, `preferredLanguage`, `favoriteCategory`); a blank `streetName2` becomes `null`; email stays optional; unticked preferences become `false`. Compose expiry via `composeExpiry`. Reduce the card number via `toLastFour`. On update, a blank or masked card number keeps the stored `cardLastFour` (P3).
2. `lib/account/view.ts` (new, types + a pure mapper only, no `db` import, because the client imports it): `AccountView` with the masked card and split expiry.
3. `routes/api/account/index.get.ts`: `requireSignOn`, then `getCustomerAccount(session.userId)` → `AccountView`; 404 when signed on without a customer.
4. `routes/api/account/index.put.ts`: validate (`update`), `replaceCustomerAccount`, then `applyPreferredLanguageOnProfileSave`; return the new `AccountView`.
5. `routes/api/customers.post.ts`: keep the pending-registration guard, sign-on and redirect logic exactly. Replace its two inserts with `parseAccountForm(…, "create")` → `createCustomer` + `replaceCustomerAccount` in one transaction. On 400 the session stays pending.
6. Tests: route integration tests with a real `H3Event` (mirror `routes/api/customers.test.ts`); one named test per AC, named with its approved `SWHR-C-*` id. Update the existing `customers.test.ts` cases to send the full form.

## File/module ownership

- `lib/account/form.ts`, `lib/account/form.test.ts`, `lib/account/view.ts` — new
- `routes/api/account/index.get.ts`, `routes/api/account/index.put.ts`, `routes/api/account/index.test.ts` — new
- `routes/api/customers.post.ts`, `routes/api/customers.test.ts`

## Interface contracts (fixed — SWHR-T-0083/0084 code against these)

```ts
// lib/account/form.ts
export type AccountField = "familyName" | "givenName" | "streetName1" | "streetName2" | "city" | "state" | "zipCode" | "country"
  | "telephone" | "email" | "cardNumber" | "cardType" | "expiryMonth" | "expiryYear" | "preferredLanguage" | "favoriteCategory";
export type AccountFormInput = Partial<Record<AccountField, string>> & { myListPreference?: boolean; bannerPreference?: boolean };
// lib/account/view.ts
export interface AccountView {
  userId: string; status: "active" | "disabled";
  contactInfo: ContactInfoValue;                                   // from lib/account/types.ts
  creditCard: { cardNumberMasked: string; cardType: string; expiryMonth: string; expiryYear: string };
  profile: ProfileValue;
}
// HTTP
GET  /api/account                          → 200 AccountView | 401 | 404
PUT  /api/account   body AccountFormInput  → 200 AccountView | 400 { missing: AccountField[] } | 401
POST /api/customers body AccountFormInput  → 200 { redirect: string } | 400 { missing: AccountField[] } | 401
```

## Definition of Done

AC-1 … AC-8 on the ticket, each proven by a named test.
