# Fix note — SWHR-T-0064

Change: `swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00` (design.md §D3).

## Root cause

The platform's green-phase stub-sentinel scanner (not in this repository) matches the
literal sentinel string anywhere in the repo tree, not just at live stub call sites. Two
non-stub locations carried the literal text:

- `.vortex/config.yaml:99`, the `testEvidence.stubSentinel` declaration itself.
- Prose in 13 merged `artifacts/**/tdd-test-result.md` files (SWHR-S-0003/0004/0005),
  which described past red-phase stub swaps by quoting the sentinel.

Every green run since SWHR-S-0004 records `valid: false` for this reason, even though no
actual unreplaced stub was present (SWHR-T-0057, -0058, -0059, -0061). The scanner itself
is platform code and out of scope for this repo; the durable fix (scoping the scan to the
ticket's diff or stub call sites) is tracked as follow-up F1 in the change's proposal.md.

## Minimal fix

1. `.vortex/config.yaml` — re-encode the `stubSentinel` value as a YAML double-quoted
   scalar with one character `\x`-escaped: `"Vortex\x4EotImplemented"`. Every YAML
   1.1/1.2 parser decodes this to the identical configured stub sentinel, verified
   here with `js-yaml`, so live-stub detection is unaffected while the literal text no
   longer appears in the file.
2. `artifacts/SWHR-S-0003/**`, `artifacts/SWHR-S-0004/**`, `artifacts/SWHR-S-0005/**`
   `tdd-test-result.md` — reworded every literal mention to "the configured stub
   sentinel" (or `<configured stub sentinel>` inside quoted terminal output), preserving
   the original meaning of each passage.
3. `.vortex/agents-generated.md` — appended a note telling agents to refer to the
   sentinel as "the configured stub sentinel" in artifact prose rather than quoting it,
   so the mitigation doesn't erode as later artifacts are written.

Live stubs in source/test files are untouched and keep throwing the literal sentinel
exactly as before — no source or test file was modified other than the new regression
test.

## Known residual (out of file ownership)

`artifacts/SWHR-S-0006/SPRINT-PLAN.md` line 19 still quotes the sentinel — it's this very
ticket's title, embedded in the sprint plan by the planning agent. That file is not in
this ticket's file ownership (`artifacts/SWHR-S-0003|0004|0005/**/tdd-test-result.md`
only) and isn't one of the 13 files design.md's re-verified context names. Left untouched
per blast-radius scope; flagged here rather than edited silently.

## Files touched

- `.vortex/config.yaml` — re-encoded `stubSentinel` line.
- `.vortex/agents-generated.md` — appended agent note.
- `artifacts/SWHR-S-0003/SWHR-T-{0028..0033}/tdd-test-result.md` — reworded sentinel mentions.
- `artifacts/SWHR-S-0004/SWHR-T-{0042,0043,0044,0045,0047}/tdd-test-result.md` — reworded sentinel mentions.
- `artifacts/SWHR-S-0005/SWHR-T-{0059,0061}/tdd-test-result.md` — reworded sentinel mentions.
- `src/utils/stubSentinelHygiene.test.ts` — new regression test (red→green proof in `tdd-test-result.md`).
