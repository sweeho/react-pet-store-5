# PLAN — SWHR-T-0136: Message dispatch (task group 4)

Change: `swhr-i-0011-order-fulfillment`. Read its `design.md` §"Sprint planning — SWHR-S-0014" first. Requirements: **Workflow step failures preserve their root cause**, **Configured dependencies fail fast**.

## Design reference

No design blocks: this capability has no screens (the change's design.md §User interface).

## Objective

Give the processing steps a typed step error and fail-fast channel resolution, and add the completed-order channel. The existing outbox writer and dispatcher are already built (SD-2), so this ticket only verifies them.

## Steps

1. Read design P4, SD-2 and SD-7.
2. Write the two scenario tests first, in `lib/messaging/errors.test.ts` and `lib/messaging/channels.test.ts`, titled SWHR-C-0388 and SWHR-C-0389. In SWHR-C-0389, the registry passed in lacks `opc.invoice`, and the test spies on a would-be fallback to show it is never used.
3. Implement `errors.ts` (`WorkflowStepError`, `DependencyResolutionError`, `runStep`) and `channels.ts` (`resolveChannel`, whose default registry is the outbox's fixed subscriber table) per P4.
4. In `outbox.ts`, add `opc.completed-order` to `Channel` and to the subscriber table (`customer-notification`). Export the subscriber table read-only for `resolveChannel`.
5. Tasks 4.1 and 4.2: confirm the existing `outbox.test.ts` and `dispatcher.test.ts` cover enqueue inside the caller's transaction, retry and the dead letter. Add a case only if one is missing.

## File/module ownership

- `lib/messaging/outbox.ts`
- new `lib/messaging/errors.ts`, `errors.test.ts`, `channels.ts`, `channels.test.ts`
- `lib/messaging/outbox.test.ts`, `lib/messaging/dispatcher.test.ts` (only if a case is missing)

Do not touch `lib/orders/**` or `plugins/**`.

## Definition of Done

AC-1 to AC-3 of the ticket.
