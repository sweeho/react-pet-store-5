# TDD result — SWHR-T-0119

## Test cases

- SWHR-C-0303: non-approval root fails to read (`lib/b2b/documents/orderApproval.test.ts`)
- SWHR-C-0304: batch with no orders fails to read
- SWHR-C-0305: empty or missing `OrderStatus` fails naming `OrderStatus`

Each runs with validation on and off. Also covered: XSD round trip, empty write throws, thresholds table, two outbox channels.

## Notes

Platform-recorded runs. Red run id: 5b05745b-0f66-44aa-982d-25be06410ce8 (all three cases failed on the stub). Green run id: see the green run recorded after implementation commit.

Full gate `bun run verify` (lint, typecheck, unit): exit 0, 170 files, 834 tests passed.
