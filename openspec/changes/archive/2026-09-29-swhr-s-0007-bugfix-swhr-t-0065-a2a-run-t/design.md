# Design — swhr-s-0007-bugfix-swhr-t-0065-a2a-run-t

## Context (measured on sprint base `49deba9`)

- A tracked-file search for the literal sentinel returns exactly two files: `artifacts/SWHR-S-0006/SPRINT-PLAN.md` (line 19, SWHR-T-0064's title) and `src/utils/stubSentinelHygiene.test.ts` (its `SENTINEL` constant). No live stub exists on the base.
- `.vortex/config.yaml:99` already stores the sentinel as an escaped YAML scalar (SWHR-S-0006 §D3). Leave it alone.
- `src/utils/stubSentinelHygiene.test.ts` has two cases: config decoding, and a scan of files named `tdd-test-result.md` under `artifacts/`.

## D1 — Guard scope: documentation and configuration, not source

The guard scans every file under `artifacts/`, `openspec/` and `.vortex/`, plus the repository-root `*.md` files. It does not scan source or test files (`src/`, `routes/`, `lib/`, `middleware/`, `plugins/`, `e2e/`, `db/`). A red-phase commit legitimately contains live stubs that throw the sentinel there. If the guard failed on them, the red commit would carry an extra, unrelated failing test.

Enumerate files by walking the directories, as the existing `findFiles` helper does. Skip `node_modules` and any dot-directory other than `.vortex` itself.

## D2 — The guard must not contain the literal

Build the `SENTINEL` constant without the literal text, using the same one-character `\x4E` escape the config uses (a TS string escape decodes identically). The config-decoding assertion then compares two escaped forms against each other. Pin it with a non-escaped check: the decoded value has length 20 and starts with `Vortex`, so a typo in both escapes cannot silently agree.

## D3 — Residual in the closed S-0006 index

`artifacts/SWHR-S-0006/SPRINT-PLAN.md` is platform-generated, but S-0006 is closed and the platform no longer regenerates it. Reword the quoted sentinel in the SWHR-T-0064 title cell to "the configured stub sentinel". Change nothing else in that file.

## D4 — Verification of the live defect

This ticket's own `a2a_run_tests(phase: "green")` run is the live check. Record its reasons in the ticket's test-result artifact. If it still cites a stub-sentinel match in a file outside this ticket's changes, that is platform follow-up F1. Record it; do not work around it further in the repo.

## Risks

- A future platform-generated `SPRINT-PLAN.md` may quote a ticket title that contains the sentinel (proposal F2). The widened guard turns this into a failing unit test on the sprint branch, which is the intended signal.
