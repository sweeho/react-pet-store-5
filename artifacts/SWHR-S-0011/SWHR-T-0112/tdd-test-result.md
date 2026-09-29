# TDD result — SWHR-T-0112

## Test cases

- SWHR-C-0284: EmptyCartFailure maps to `/order-error`, status 409.
- SWHR-C-0285: an error of kind `UnmappedTestFailure` raised in a handler built on a real `H3Event` answers 500 with message "Unhandled failure: UnmappedTestFailure".
- Extra: MissingFormData covered by the General entry (`/error`, 400, `missing` carried); DuplicateAccount to `/user-creation-error`; plain `TypeError` named by its class.

## Notes

- Red run id: 27bcb90c-0905-4a32-a4f3-77fb1eb269b2 (both cases stub failures).
- Green run id: 6ee6f8ae-4315-4841-aab9-4b1ee43178ab (both pass).
- Full gate `bun run verify`: exit 0, 159 files, 788 tests passed.
