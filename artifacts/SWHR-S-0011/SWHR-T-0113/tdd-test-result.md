# TDD result — SWHR-T-0113

## Test cases

- `lib/orders/money.test.ts`: minorToDecimal/decimalToMinor for en_US, zh_CN, ja_JP and their inverse; too many fraction digits names the value; non-numeric/unsupported locale rejected; exactness (1.15, 0.29).
- `lib/checkout/card.test.ts`: masked number, type, MM/YYYY expiry; null expiry uses the legacy fallback.

## Red run

Not recorded as a separate run: the modules under test did not exist when the tests were written, so every test would have failed at import. Tests and implementation were written together and first executed together.

## Green run

`bun run test lib/orders/money lib/checkout` → 2 files, 10 tests passed.
Full gate `bun run verify` (lint + typecheck + unit) → exit 0, 156 files, 773 tests passed.

TDD-RESULT: 10 passed, 0 failed
