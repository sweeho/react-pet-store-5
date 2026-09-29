# SWHR-T-0081 — Account domain services

Change `swhr-i-0007-customer-account-and-profile`, tasks.md group 2. Read `openspec/changes/swhr-i-0007-customer-account-and-profile/design.md` §Sprint planning first (P2, P3, P5, P7). Depends on SWHR-T-0080 (tables) and, through it, SWHR-T-0085 (`lib/account/cardNumber.ts`).

## Objective

`lib/account/` exposes every data operation the spec names: atomic customer creation with defaults, seeded account creation, the three contact-information paths, field-level read/update with detached whole-value reads, lookups, expiry derivation and deletion. No function checks roles or sessions (R-0123; ARCHITECTURE.md Key Decision "access checks live in the caller").

## Design reference

No UI.

## Steps

1. `lib/account/types.ts`: the value types below.
2. `lib/account/expiry.ts`: compose `MM/YYYY`; month = text before the first `/`, year = all text after it; absent or no `/` → `01` / `2010` (P5).
3. `lib/account/contactInfo.ts`: the three creation paths (R-0121), `getContactInfo` returning a detached copy including the address, `updateContactField`.
4. `lib/account/customer.ts`: `createCustomer` builds customer → account (active) → empty contact + empty address + empty card → default profile in one `db.transaction` (R-0115–R-0117). It accepts an optional transaction so the registration route can add its writes to the same unit. Also `createAccount` (seeded, R-0120), `getCustomerAccount`, `listCustomers`, `deleteCustomer` (relies on the cascade), and `replaceCustomerAccount` (the update used by the routes: contact, address, card, profile in one transaction).
5. Tests per module; one named test per AC, named with its approved `SWHR-C-*` case id from `test-cases.md`. The atomic-failure scenario injects a failing profile step in the test (e.g. `vi.spyOn`/mock); it does not add a production flag.

## File/module ownership

- `lib/account/types.ts`, `lib/account/expiry.ts`, `lib/account/contactInfo.ts`, `lib/account/customer.ts` — new
- `lib/account/expiry.test.ts`, `lib/account/contactInfo.test.ts`, `lib/account/customer.test.ts` — new

## Interface contracts (fixed — SWHR-T-0082 codes against these)

```ts
// lib/account/types.ts
export type AccountStatus = "active" | "disabled";
export interface AddressValue {
  streetName1: string;
  streetName2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
export interface ContactInfoValue {
  givenName: string;
  familyName: string;
  telephone: string;
  email: string;
  address: AddressValue;
}
export interface CreditCardValue {
  cardLastFour: string;
  cardType: string;
  expiryDate: string | null;
}
export interface ProfileValue {
  preferredLanguage: string;
  favoriteCategory: string | null;
  myListPreference: boolean;
  bannerPreference: boolean;
}
export interface CustomerAccount {
  userId: string;
  status: AccountStatus;
  contactInfo: ContactInfoValue;
  creditCard: CreditCardValue;
  profile: ProfileValue;
}
// lib/account/expiry.ts
export function composeExpiry(month: string, year: string): string;
export function expiryMonth(expiry: string | null | undefined): string;
export function expiryYear(expiry: string | null | undefined): string;
// lib/account/customer.ts   (Tx = the drizzle transaction type from db/client)
export function createCustomer(userId: string, tx?: Tx): void; // throws on an existing userId
export function getCustomerAccount(userId: string): CustomerAccount | null; // detached copy
export function listCustomers(): string[]; // user ids
export function replaceCustomerAccount(
  userId: string,
  value: Pick<CustomerAccount, "contactInfo" | "creditCard" | "profile">,
  tx?: Tx,
): void;
export function deleteCustomer(userId: string): void;
```

## Definition of Done

AC-1 … AC-17 on the ticket, each proven by a named test.
