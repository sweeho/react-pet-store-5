# SWHR-T-0108 — Identifier generation

Added `nextId(prefix, tx?)`, `ORDER_ID_PREFIX = "1001"` and `CounterCreationError` in `lib/ids/counter.ts`. It inserts the counter at 0 with `onConflictDoNothing`, then does `update … returning`, and returns prefix plus value unpadded. With `tx` it joins the caller's transaction; without, it opens an immediate transaction. An insert failure throws `CounterCreationError` naming the prefix.

Files: `lib/ids/counter.ts`, `lib/ids/counter.test.ts`.

AC coverage: AC-1 to AC-6 map to SWHR-C-0274 to SWHR-C-0279, one test each.

Deviation: the concurrency test (C-0278) runs each connection's call synchronously, so the two calls serialize rather than interleave; the immediate-transaction lock and the file database still exercise the cross-connection path.

Verification: `bun run verify` exit 0 (783 tests passed). Red/green recorded via the platform.
