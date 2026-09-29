# Summary — SWHR-T-0136

Adds `WorkflowStepError`/`DependencyResolutionError`/`runStep` (`lib/messaging/errors.ts`), fail-fast `resolveChannel` (`channels.ts`, default registry is the new exported `CHANNELS` from the outbox), and channel `opc.completed-order` → `customer-notification` in `outbox.ts`.

Files: `lib/messaging/{errors,channels}.ts` and their tests, `outbox.ts`, `outbox.test.ts` (one table row for the new channel).

Existing outbox/dispatcher tests already cover in-transaction enqueue, retry and dead letter (tasks 4.1, 4.2); no cases added.

AC: step error keeps root cause (SWHR-C-0388); missing channel throws with cause, no fallback (SWHR-C-0389); channel exists.
Verification: `bun run verify` exit 0 (909 tests passed).
