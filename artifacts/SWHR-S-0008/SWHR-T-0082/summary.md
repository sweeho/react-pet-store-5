# SWHR-T-0082 summary

Server side of the account: `parseAccountForm` (shared create/update validation, P6), `toAccountView`, `GET`/`PUT /api/account`, and `POST /api/customers` now takes the full form and writes customer, account, contact, address, card and profile in one transaction. The user id always comes from the session; a `userId` in a PUT body is ignored. An incomplete form returns `400 { missing }`, and a registration session stays pending.

## Files

- `lib/account/form.ts`, `form.test.ts`, `view.ts` (new)
- `routes/api/account/index.get.ts`, `index.put.ts`, `index.test.ts` (new)
- `routes/api/customers.post.ts`, `customers.test.ts`

## Decisions

- An unsupported `preferredLanguage` is reported as missing (checked with `parseLocale`).
- Country is stored as submitted and is not required, per the PLAN's required-field list.
- The test form fixture is inlined in each test file: a shared non-test fixture file counted as production code in the red-run check.

## AC coverage

AC-1 SWHR-C-0217, AC-2 0218, AC-3 0201, AC-4 0219, AC-5 0220, AC-6 0221, AC-7 0222, AC-8 own-record and 401/404 tests in `routes/api/account/index.test.ts`.

## Verification

`bun run verify` — pass (139 files, 678 tests). E2E not run: no UI change.
