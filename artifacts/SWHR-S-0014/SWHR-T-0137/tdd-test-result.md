# TDD result — SWHR-T-0137

## Test cases

SWHR-C-0351, C-0352, C-0353, C-0355 to C-0361 in `lib/orders/workflow.test.ts` (plus a lifecycle-guard case), and a 0008 to 0009 upgrade case in `lib/db/migrate.test.ts`.

## Red run

Run id 2187a250-186d-4a71-a461-ca4a0e799fa4 (valid). Eight cases failed on the stub, C-0358 and C-0359 on assertions. (An earlier run, 52ce599e, was invalid because the error classes were real code, not stubs.)

## Green run

Run id 95456ff8-a0e4-400d-be0f-91251c85f45e (valid): all ten cases pass. `bun run verify:full` exit 0: 930 unit tests passed, 69 E2E passed.

## Notes

Red run id above; green run id above.
