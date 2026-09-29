# PLAN — SWHR-T-0108: Identifier generation

Change: `swhr-i-0009-checkout-and-order-placement` · Tasks group 2 · Requirements: **Order identifier format**, **Per-prefix identifier counters**, **Atomic identifier issuance**

## Design reference

No UI in this ticket. The sprint's mockups are under `artifacts/SWHR-S-0011/design/` (index: `MANIFEST.md`); they are not needed here.

## Objective

Issue identifiers from a per-prefix counter atomically, joining the caller's transaction, so order ids run 10011, 10012 and so on and are never duplicated.

## Steps

1. Read `openspec/changes/swhr-i-0009-checkout-and-order-placement/design.md`: §Mapping to the rebuild stack (Identifier issuance), then §Sprint planning P4.
2. Add `lib/ids/counter.ts` with `ORDER_ID_PREFIX`, `nextId` and `CounterCreationError` (P4).
   - Use the drizzle query builder only: `onConflictDoNothing`, then an `update … returning`.
   - Without `tx`, open an immediate transaction.
3. Tests in `lib/ids/counter.test.ts`, titled with the case keys:
   - [SWHR-C-0274] 10011, 10012 and 10013.
   - [SWHR-C-0275] Counter at 7 gives 10018 and then holds 8.
   - [SWHR-C-0276] A new prefix 2002 gives 20021.
   - [SWHR-C-0277] The insert is stubbed to throw; the error names 2002.
   - [SWHR-C-0278] Two bun:sqlite connections on a temporary file database, migrated with `migrateDatabase`, with the counter at 20: the results are {100121, 100122} and the counter holds 22. Remove the temporary file afterwards.
   - [SWHR-C-0279] The caller's transaction rolls back and the counter is still 5.

## File/module ownership

- `lib/ids/counter.ts`, `lib/ids/counter.test.ts` (new)

Fixed interface: `ORDER_ID_PREFIX = "1001"`, `nextId(prefix: string, tx?: Executor): string` and `CounterCreationError`, whose message contains the prefix.

## Definition of Done

AC-1 … AC-6 by `lib/ids/counter.test.ts`.
