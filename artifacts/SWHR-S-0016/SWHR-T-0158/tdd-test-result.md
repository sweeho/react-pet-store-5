## Test cases

- SWHR-C-0419 (unit): `[SWHR-C-0419]` tests in `lib/notifications/config.test.ts` and `plugins/customer-notification.test.ts`.
- Also: non-boolean switches, missing/invalid file, committed file, mail defaults/overrides, bad port, `mail.request` channel resolution.

## Red run

`bun --bun vitest run lib/notifications plugins/customer-notification.test.ts lib/messaging/channels.test.ts` against stubs: 19 failed, 2 passed (3 files failed).
The platform `a2a_run_tests` red call was not recorded: the first call returned invalid (a config JSON was in the red commit, since removed); every later call failed with an MCP transport drop.

## Green run

`bun run verify` (lint + typecheck + unit): exit 0, 196 files, 1022 tests passed.

## Notes

No platform run ids: `a2a_run_tests` transport dropped repeatedly (see Red run).

TDD-RESULT: 1022 passed, 0 failed
