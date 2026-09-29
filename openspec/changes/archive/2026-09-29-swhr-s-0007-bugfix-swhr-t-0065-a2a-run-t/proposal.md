# Bugfix batch SWHR-S-0007: stub-sentinel false positives in historical docs

## Why

- **SWHR-T-0065** — the platform's green-phase stub-sentinel scan (`a2a_run_tests(phase: "green")`) matches the literal sentinel text anywhere in the repository, so documentation that merely quotes it marks a green run invalid. Re-verified on the sprint base (`49deba9`):
  - The report's evidence predates SWHR-S-0006. SWHR-T-0064 (change `swhr-s-0006-bugfix-swhr-t-0023-swhr-t-00`, design §D3) already re-encoded the `.vortex/config.yaml` declaration and reworded the 11 cited `tdd-test-result.md` files plus two more. The S-0006 sprint summary records that the next two green runs (SWHR-T-0023, SWHR-T-0050) listed no stub-sentinel reason.
  - Two literal occurrences remain in tracked files: `artifacts/SWHR-S-0006/SPRINT-PLAN.md:19` (SWHR-T-0064's own title, embedded by the platform-generated index) and `src/utils/stubSentinelHygiene.test.ts` (the guard's own constant).
  - The guard only checks `.vortex/config.yaml` and files named `tdd-test-result.md`. Any other artifact, change or spec document that quotes the sentinel passes the guard and reintroduces the false positive.
  - The scanner itself is platform code. Its scope (fix ACs 1–3 on the defect as filed) cannot be changed from this repository.

## What Changes

- The repository carries the literal sentinel text only at live stub call sites. The two residual occurrences are removed.
- The hygiene guard widens from `tdd-test-result.md` files to every tracked documentation and configuration location, and stops carrying the literal itself.
- New requirement recording the rule, so the guard is part of the spec of record rather than an undocumented test (SPEC-GAP: no requirement covered this before).

## Impact

- Capabilities: `local-development` (ADDED Stub sentinel confined to live stubs).
- Code: `src/utils/stubSentinelHygiene.test.ts`, `artifacts/SWHR-S-0006/SPRINT-PLAN.md` (one table cell).
- Follow-ups (out of scope, not filed; planning has no DEFECT authority):
  - F1 (carried from SWHR-S-0006): scope the platform's green stub-sentinel scan to the ticket's red→green diff or to `testEvidence.testGlobs`. This is the only fix for SWHR-T-0065 ACs 1–3 as filed; the repo side can only keep the tree clean.
  - F2: platform-generated sprint indexes copy ticket titles verbatim. A future ticket whose title quotes the sentinel will re-add it on the next generated `SPRINT-PLAN.md`; the widened guard catches it, but only after it lands.
