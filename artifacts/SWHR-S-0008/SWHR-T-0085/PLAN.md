# SWHR-T-0085 — Encode the resolved open questions

Change `swhr-i-0007-customer-account-and-profile`, tasks.md group 6. Read `openspec/changes/swhr-i-0007-customer-account-and-profile/design.md` §Sprint planning first (P3, P4, P5, P7). This is the first ticket in the chain; SWHR-T-0080 depends on it.

## Objective

The open questions that block the data model and the forms are answered in design.md. This ticket turns those answers into two small, shared modules: card-number masking and the account form's reference lists.

## Design reference

No UI of its own. The mockups under `artifacts/SWHR-S-0008/design/` show the lists and the masked card (`mockup-create-account-account-information-form-.html`, `mockup-edit-account-preselected-with-stored-val.html`, `mockup-account-overview.html`).

## Steps

1. `lib/account/cardNumber.ts` (new) — P3: keep only the last four digits of a submitted number (non-digits ignored), render the masked form, and recognise a masked value coming back from the edit form.
2. `lib/account/reference.ts` (new) — P4: card types, countries, states, months `01`–`12`, expiry years (current year + 3, plus a stored year outside the range), favourite category ids with English fallback labels, languages from `SUPPORTED_LOCALES`.
3. Tests next to each module (`lib/**` runs in the Vitest `server` project); name each test after the AC it proves.
4. Post a ticket comment listing P3–P7 as the decisions encoded, for human confirmation.

## File/module ownership

- `lib/account/cardNumber.ts`, `lib/account/cardNumber.test.ts` — new
- `lib/account/reference.ts`, `lib/account/reference.test.ts` — new

## Interface contracts (fixed — SWHR-T-0081/0082/0083 code against these)

```ts
// lib/account/cardNumber.ts
export function toLastFour(cardNumber: string): string; // "4111-1111-1111-1111" → "1111"
export function maskCardNumber(lastFour: string): string; // "1111" → "•••• •••• •••• 1111"; "" → ""
export function isMaskedCardNumber(value: string): boolean; // true for maskCardNumber output
// lib/account/reference.ts
export const CARD_TYPES: readonly ["Java(TM) Card", "Duke Express", "Meow Card"];
export const COUNTRIES: readonly ["United States", "Canada", "Japan", "China"];
export const STATES: readonly ["California", "New York", "Texas"];
export const EXPIRY_MONTHS: readonly string[]; // "01" … "12"
export function expiryYears(now?: Date, storedYear?: string | null): string[];
export const FAVORITE_CATEGORIES: readonly {
  id: "BIRDS" | "CATS" | "DOGS" | "FISH" | "REPTILES";
  label: string;
}[];
export const ACCOUNT_LANGUAGES: readonly { id: SupportedLocale; label: string }[]; // "English (en_US)", …
export const DEFAULT_LANGUAGE = "en_US";
export const DEFAULT_FAVORITE_CATEGORY = "BIRDS";
```

## Definition of Done

AC-1 … AC-6 on the ticket, each proven by a named test. No module imports `db/client.ts` (the client project imports `reference.ts`).
