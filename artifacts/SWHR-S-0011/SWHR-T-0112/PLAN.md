# PLAN — SWHR-T-0112: Error routing by failure kind

Change: `swhr-i-0009-checkout-and-order-placement` · Tasks group 6 · Requirement: **Error screen selection by failure kind**

## Design reference

No UI in this ticket. The sprint's mockups are under `artifacts/SWHR-S-0011/design/` (index: `MANIFEST.md`); they are not needed here. The screens it points at (`/order-error`, `/error`) are built by SWHR-T-0111; this ticket only names them.

## Objective

One app-wide mapping from failure kind to error screen, with subtypes covered by their parent kind, and a generic 500 naming the kind for anything unmapped.

## Steps

1. Read `openspec/changes/swhr-i-0009-checkout-and-order-placement/design.md`: §Legacy flow step 7, then §Sprint planning P5 and SD-1.
2. Add `lib/errors/failures.ts`: `Failure`, `GeneralFailure`, `MissingFormDataFailure extends GeneralFailure`, `EmptyCartFailure` and `DuplicateAccountFailure` (P5).
3. Add `lib/errors/routing.ts`: `ERROR_SCREENS`, where the first match by `instanceof` wins, and `failureResponse(error)` (P5). Unmapped errors answer 500, `screen: null`, message `Unhandled failure: <kind>`.
4. Tests in `lib/errors/routing.test.ts`:
   - [SWHR-C-0284] An `EmptyCartFailure` maps to `/order-error` with status 409.
   - [SWHR-C-0285] An error of kind `UnmappedTestFailure` raised inside a real `H3Event` handler that answers with `failureResponse` gives a 500 whose message names the kind.
   - `MissingFormDataFailure` is covered by the General entry (`/error`).
   - `DuplicateAccountFailure` maps to `/user-creation-error`.

## File/module ownership

- `lib/errors/failures.ts`, `lib/errors/routing.ts`, `lib/errors/routing.test.ts` (new)

Fixed interfaces: P5's class names and kinds, `ERROR_SCREENS`, `failureResponse(error: unknown): { status: number; body: FailureBody }` and `FailureBody`. `routes/api/customers.post.ts` is not changed.

## Definition of Done

AC-1 and AC-2 by `lib/errors/routing.test.ts`. SWHR-T-0109 later exercises AC-1 through the real order route.
