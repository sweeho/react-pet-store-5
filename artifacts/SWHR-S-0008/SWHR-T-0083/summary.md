# SWHR-T-0083 summary

Built the account screens against the mockups: `src/components/account/AccountForm.tsx` (shared create/edit form, fixed choice lists, client-side "<Field name> is empty." check with a summary alert and per-field messages, server `missing` rendered the same way), `src/pages/register.tsx` (full form, English and Birds preselected, posts to `/api/customers`), `src/pages/account.tsx` (read-only overview: masked card, split expiry, Yes/No pills, edit link), `src/pages/account-edit.tsx` (new; preselected, `PUT /api/account`, back to `/account`), `src/hooks/useAccount.ts` (+ index export), copy in `src/i18n/screens/{account,register,account-edit}.ts` for en_US, ja_JP, zh_CN. `e2e/sign-on.spec.ts` now completes the new form via `e2e/account-helpers.ts`; new `e2e/account.spec.ts` covers 0230/0231.

AC coverage: AC-1..AC-5 by named tests (0223, 0224, 0225, 0230, 0231); AC-6 by the updated registration helper in `e2e/sign-on.spec.ts`. Verification: `bun run verify` exit 0 (691 tests). E2E not run locally (no Chromium in this container).

Deviations: added `e2e/account-helpers.ts` and `e2e/account.spec.ts` (outside the ownership list; needed for AC-6 and the e2e cases). The e2e cases store expiry 2004 through `PUT /api/account` because the form only offers current-year expiries. The Cancel link and `submitLabel` prop are additions to `AccountForm`.
