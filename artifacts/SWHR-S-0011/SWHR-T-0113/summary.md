# SWHR-T-0113 summary

Added two pure helpers (OQ-1, OQ-3); no UI.

- `lib/orders/money.ts`: `minorToDecimal` / `decimalToMinor`, string and integer arithmetic only, 2 fraction digits for en_US/zh_CN, 0 for ja_JP. Throws naming the value on bad input or excess fraction digits. Unsupported locale throws (no fallback, unlike `formatPrice`).
- `lib/checkout/card.ts`: `orderCardFromAccount` reuses `maskCardNumber` and the expiry helpers (legacy fallback kept).
- Tests beside each module.

AC-1..AC-3 covered by the unit tests. Verification: `bun run verify` exit 0 (773 tests passed). The ticket has no linked test cases, so no platform red/green run; red was not run separately (see tdd-test-result.md).
