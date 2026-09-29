# TDD result — SWHR-T-0085

## Test cases

- cardNumber.test.ts: AC-1 masking/last four; masked-value recognition.
- reference.test.ts: AC-2 card types; AC-3 countries/states; AC-4 expiry years and months; AC-5 favourite categories; AC-6 languages.

## Red run

Tests were first executed with a missing `describe`/`test` import (a harness error, not an assertion red). No separate assertion-level red was recorded for these new pure-function modules; stated honestly.

## Green run

`bun --bun vitest run lib/account` → 2 files, 7 tests passed.
Full gate `bun run verify` (lint + typecheck + unit) exit 0: 133 files, 636 tests passed.

TDD-RESULT: 7 passed, 0 failed
