# PLAN — SWHR-T-0065: green stub-sentinel scan false-positives on historical docs

Change: `swhr-s-0007-bugfix-swhr-t-0065-a2a-run-t`. Read `openspec/changes/swhr-s-0007-bugfix-swhr-t-0065-a2a-run-t/design.md` first.

## Objective

The scanner is platform code (proposal follow-up F1). This ticket makes the repository conform to the requirement "Stub sentinel confined to live stubs". It removes the last two literal occurrences and widens the guard so no documentation file can reintroduce one unnoticed. Refer to the sentinel only indirectly in every artifact you write, as `.vortex/agents-generated.md` already asks.

## Steps

1. Red: widen `src/utils/stubSentinelHygiene.test.ts` per design.md §D1 and add the self-check per §D2. Confirm the widened scan fails on the base, naming `artifacts/SWHR-S-0006/SPRINT-PLAN.md` and the test file itself.
2. Green: rewrite the `SENTINEL` constant per §D2, and reword the SWHR-T-0064 title cell per §D3.
3. Prove the "caught" scenario by temporarily adding a quoting file outside `tdd-test-result.md`, watching the test fail and name it, then removing the file. Record this in the test-result artifact; do not commit the probe.
4. Record the platform green-run verdict and reasons per §D4.

## File/module ownership

- `src/utils/stubSentinelHygiene.test.ts`
- `artifacts/SWHR-S-0006/SPRINT-PLAN.md` (the SWHR-T-0064 row only)
- `artifacts/SWHR-S-0007/SWHR-T-0065/**` (this ticket's own execution artifacts)

## Definition of Done

AC-1 through AC-4 on the ticket hold. `.vortex/config.yaml` is unchanged.
