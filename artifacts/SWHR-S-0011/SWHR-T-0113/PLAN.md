# PLAN — SWHR-T-0113: Encode the resolved open questions (order card, exact money)

Change: `swhr-i-0009-checkout-and-order-placement` · Tasks group 7 · Open questions OQ-1, OQ-3 (OQ-5 is encoded by SWHR-T-0107)

## Design reference

No UI in this ticket. The sprint's mockups are under `artifacts/SWHR-S-0011/design/` (index: `MANIFEST.md`); they are not needed here.

## Objective

Provide the two pure helpers that later tickets build on: the order card from the account card on file, and exact conversion between integer minor units and the decimal strings in the purchase-order document.

## Steps

1. Read `openspec/changes/swhr-i-0009-checkout-and-order-placement/design.md` §Sprint planning: P1 and P2, plus the Key Decisions in ARCHITECTURE.md on card storage and minor units.
2. Add `lib/orders/money.ts` (P2).
   - Fraction digits per locale match `lib/locale/money.ts`: 2 for en_US and zh_CN, 0 for ja_JP.
   - Use integer and string arithmetic only; no `/ 100` into a float.
   - Invalid input or too many fraction digits throws an error naming the value.
3. Add `lib/checkout/card.ts` `orderCardFromAccount` (P2).
   - Reuse `maskCardNumber` from `lib/account/cardNumber.ts` and the expiry helpers in `lib/account/expiry.ts`, including their legacy fallback when the expiry is null.
4. Add unit tests next to each module.

## File/module ownership

- `lib/orders/money.ts`, `lib/orders/money.test.ts` (new)
- `lib/checkout/card.ts`, `lib/checkout/card.test.ts` (new)

Fixed interfaces (P2): `minorToDecimal(minor: number, locale: LocaleId): string`, `decimalToMinor(value: string, locale: LocaleId): number`, `orderCardFromAccount(card: CreditCardValue): CreditCard`.

## Definition of Done

AC-1 … AC-3 by the unit tests above. Planning records the OQ-1, OQ-3 and OQ-5 resolutions in design.md; this ticket does not edit `openspec/`.
