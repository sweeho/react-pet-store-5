# SWHR-T-0112 summary

- `lib/errors/failures.ts`: `Failure` base and `GeneralFailure`, `MissingFormDataFailure` (carries `missing`), `EmptyCartFailure`, `DuplicateAccountFailure`, each with its `kind`.
- `lib/errors/routing.ts`: ordered `ERROR_SCREENS` (first `instanceof` match wins) and `failureResponse`; unmapped errors answer 500, `screen: null`, "Unhandled failure: <kind>" with kind from `error.kind ?? error.name`.
- `lib/errors/routing.test.ts`: cases C-0284, C-0285 plus subtype, duplicate-account and plain-error tests.

AC-1 and AC-2 covered. Verification: platform red then green recorded; `bun run verify` exit 0 (788 tests). `routes/api/customers.post.ts` untouched.
