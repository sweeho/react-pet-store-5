---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0007
idea: Not Applicable
branch: vortex/sprint/swhr-s-0007-01ffeb9c
upstream: [artifacts/SWHR-S-0007/qa-test-report.md]
---

# Release notes — SWHR-S-0007

## Fixed

- **Platform green-run check no longer flagged by repository docs.** The last two files that quoted the test-evidence stub sentinel literally now refer to it indirectly: the SWHR-S-0006 sprint index and the hygiene test. The ticket's own green run was valid, with no stub-sentinel reason cited. This has no product impact. (SWHR-T-0065)

## Changed

- `src/utils/stubSentinelHygiene.test.ts` now fails if any file under `artifacts/`, `openspec/` or `.vortex/`, or any root Markdown file, quotes the sentinel. Before, it checked only `tdd-test-result.md` files. Source and test files are still allowed to hold live stubs. (SWHR-T-0065)
- In artifact prose, write "the configured stub sentinel" rather than quoting its value. The unit suite now enforces the note already in `.vortex/agents-generated.md`.

## Upgrade notes

- There are no migrations, no API changes and no UI changes. `.vortex/config.yaml` is unchanged.

## Known issues

- SWHR-T-0072 — the Playwright browser revision does not match agent and QA containers, so E2E runs only in CI.
- SWHR-T-0070 — the platform's test-evidence runner cannot validate E2E-level test cases.
- The platform's green scan is still repository-wide (change follow-up F1). The repository is kept clean instead.

## Verification

Verified at integration QA: all 4 scenarios pass, as do 629 unit and integration tests, lint and typecheck. E2E was not run because of the container browser mismatch; nothing in this sprint affects the UI. See [qa-test-report.md](qa-test-report.md) (PASS).

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                  | Status    | Exception |
| ---------------------------- | --------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR-S-0007/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR-S-0007/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Known issues    | this file; SWHR-T-0070, SWHR-T-0072       | Satisfied | —         |
