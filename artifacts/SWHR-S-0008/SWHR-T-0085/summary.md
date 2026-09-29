# SWHR-T-0085 summary

Added `lib/account/cardNumber.ts` (toLastFour, maskCardNumber, isMaskedCardNumber) and `lib/account/reference.ts` (card types, countries, states, months, expiryYears, favourite categories, languages from `SUPPORTED_LOCALES`, defaults), with tests beside each. Neither imports `db/client.ts`.

AC-1…AC-6 each proven by a named test. Verification: `bun run verify` exit 0 (636 tests passed).

Encoded decisions: P3 masking (last four, non-digits ignored); P4 reference lists; P5–P7 per design.md §Sprint planning, no code beyond these lists. No deviations from PLAN.md.
