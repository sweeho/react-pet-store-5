---
ticket: SWHR-T-0135
---

# TDD result — SWHR-T-0135

## Test cases

SWHR-C-0341, 0342, 0343, 0344, 0345, 0347, 0348 in `lib/orders/store.test.ts`; SWHR-C-0349, 0350 in `lib/orders/lines.test.ts`. Each test title carries its case key.

## Red run

Platform run `3cea7717-08f3-4e2d-af99-06ddaa6afbba` (commit 7419d1e): valid; all nine cases failed on the stub sentinel. An earlier attempt (`2db2e066-a8c1-4aeb-a2b6-e6379adde131`) was refused because `errors.ts` was real code and C-0344 passed on the stub; the errors class became a stub and the C-0344 assertion now requires a NOT NULL error.

## Green run

Recorded through `a2a_run_tests(phase: "green")` after the implementation commit. Full gate `bun run verify`: exit 0, 178 files, 911 tests passed.

## Notes

The existing SWHR-C-0281 expectation gained `quantityShipped: 0` because the snapshot now reports it.

TDD-RESULT: 911 passed, 0 failed
