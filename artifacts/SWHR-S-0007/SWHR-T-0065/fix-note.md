# Fix note — SWHR-T-0065

## Root cause

The platform's green-phase scan matches the literal stub sentinel anywhere in the repo. Two literal occurrences remained on the sprint base: the SWHR-T-0064 title cell in `artifacts/SWHR-S-0006/SPRINT-PLAN.md`, and the `SENTINEL` constant in the hygiene guard. The guard also only scanned files named `tdd-test-result.md`, so a quote in any other doc went unnoticed. Scoping the scanner is platform work (follow-up F1).

## Minimal fix

- Guard now scans everything under `artifacts/`, `openspec/`, `.vortex/` plus root `*.md`, and skips source/test files (live stubs are legitimate there).
- The guard builds the sentinel from the same escape as `.vortex/config.yaml`, and is pinned by length 20 / `Vortex` prefix / equality with the decoded config value.
- The SWHR-T-0064 title cell now says "the configured stub sentinel".

## Files touched

- `src/utils/stubSentinelHygiene.test.ts`
- `artifacts/SWHR-S-0006/SPRINT-PLAN.md` (SWHR-T-0064 row only)
- `.vortex/config.yaml` unchanged.
