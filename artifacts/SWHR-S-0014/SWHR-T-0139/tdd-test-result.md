# TDD result — SWHR-T-0139

## Test cases

SWHR-C-0379 to C-0383 (`lib/supplier/fulfilment.test.ts`); C-0373, C-0375, C-0384, C-0386, C-0387 (`lib/supplier/stock.test.ts`); C-0372, C-0374, C-0377, C-0378 (`plugins/supplier-intake.test.ts`). Uncited extras: line-order evaluation, nothing-shippable, plugin registration, stock seed (`lib/db/inventorySeed.test.ts`).

## Red run

Run id 1bfcf1da-49c7-4f40-a9f8-fd49c5ab83d8 (valid): all 14 cases failed on the stub.

## Green run

Run id 20b82ee5-f457-444b-8429-2a98b712a857 (valid): all 14 cases pass. `bun run verify:full`: 961 unit tests passed; E2E 68 passed with one flaky smoke test (a 401 console error on the home page), then `bun run test:e2e` alone: 69 passed.

## Notes

Red run id above; green run id above.
