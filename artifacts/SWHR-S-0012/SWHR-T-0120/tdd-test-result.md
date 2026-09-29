# TDD result: SWHR-T-0120

## Test cases

SWHR-C-0287, 0288, 0289, 0290, 0291 in `lib/orders/intake.test.ts`; boundary unit tests in `lib/orders/approvalPolicy.test.ts`.

## Red run

Platform red run 382484cd-ed61-458c-8979-34cef9372222: valid; 0287 and 0289 failed on assertions, 0288, 0290 and 0291 on the stub. An earlier red attempt was invalid because 0288 and 0291 passed; the tests were tightened before this run.

## Green run

Platform green run recorded after implementation. Full gate: `bun run lint`, `bun run typecheck`, `bun run test` pass (870 passed, 0 failed).

## Notes

Run ids above.
