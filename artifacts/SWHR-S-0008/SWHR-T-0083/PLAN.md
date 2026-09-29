# SWHR-T-0083 — Account screens

Change `swhr-i-0007-customer-account-and-profile`, tasks.md group 4. Read `openspec/changes/swhr-i-0007-customer-account-and-profile/design.md` §Sprint planning first (P3, P4, P6, P8, P9). Depends on SWHR-T-0082.

## Objective

The shopper fills one account form to create their account (`/register`), sees it read-only at `/account`, and edits it at `/account-edit` with their stored values preselected. An empty validated field blocks submission with "<Field name> is empty.".

## Design reference

Build what these show (inside the existing shell; the pages contribute only `main` content):

- `artifacts/SWHR-S-0008/design/mockup-account-overview.html` (+ `wireframe-account-overview.html`)
- `artifacts/SWHR-S-0008/design/mockup-create-account-account-information-form-.html` (+ wireframe)
- `artifacts/SWHR-S-0008/design/mockup-edit-account-preselected-with-stored-val.html` (+ wireframe)
- `artifacts/SWHR-S-0008/design/mockup-account-form-submission-blocked-empty-re.html` (+ wireframe)

Index: `artifacts/SWHR-S-0008/design/MANIFEST.md`.

## Steps

1. `src/hooks/useAccount.ts` (new): fetch `GET /api/account`; returns `{ account, loading, error, refresh }`; `account` is `null` when anonymous (401) or when no customer exists (404). Export it from `src/hooks/index.ts`.
2. `src/components/account/AccountForm.tsx` (new): three sections (contact, card, profile), choice lists from `lib/account/reference.ts` (states are the fixed list, not `StateProvinceSelect`, SD6). Favourite category labels come from the catalog names when available. Create mode preselects English and Birds (P9); edit mode preselects stored values and shows the masked card (P3). The client-side empty-field check runs on submit for the required fields and shows each message beside its field and in a summary. A server `400 { missing }` renders the same messages.
3. `src/pages/register.tsx`: replace the language-only form with `AccountForm` in create mode posting to `POST /api/customers`; keep the refresh + navigate-to-redirect behaviour.
4. `src/pages/account.tsx`: the read-only overview (Yes/No preferences, masked card, split expiry) with the "Edit Your Account Information" control linking to `/account-edit`.
5. `src/pages/account-edit.tsx` (new): `AccountForm` in edit mode, `PUT /api/account`, then back to `/account`.
6. Page copy in `src/i18n/screens/account.ts`, `register.ts` and a new `account-edit.ts`, in en_US, ja_JP and zh_CN; drop the "coming soon" strings.
7. UI tests per page/component (one named test per AC, named with its approved `SWHR-C-*` id). Move the registration step in `e2e/sign-on.spec.ts` to fill the new form, and run that spec.

## File/module ownership

- `src/hooks/useAccount.ts`, `src/hooks/useAccount.test.tsx` — new; `src/hooks/index.ts`
- `src/components/account/AccountForm.tsx`, `src/components/account/AccountForm.test.tsx` — new
- `src/pages/account.tsx`, `src/pages/account.test.tsx`
- `src/pages/account-edit.tsx`, `src/pages/account-edit.test.tsx` — new
- `src/pages/register.tsx`, `src/pages/register.test.tsx`
- `src/i18n/screens/account.ts`, `src/i18n/screens/register.ts`, `src/i18n/screens/account-edit.ts` — new
- `e2e/sign-on.spec.ts` — registration step only

## Interface contracts (fixed — SWHR-T-0084 codes against this)

```ts
// src/hooks/useAccount.ts
export function useAccount(): {
  account: AccountView | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};
```

`AccountView` is imported from `lib/account/view.ts` (SWHR-T-0082); do not redeclare it.

## Definition of Done

AC-1 … AC-6 on the ticket, each proven by a named test (AC-6 by the updated `e2e/sign-on.spec.ts`).
