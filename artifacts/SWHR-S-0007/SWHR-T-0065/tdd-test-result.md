# TDD result — SWHR-T-0065

## Red run

Platform run `b51b9c2b-6401-4768-8ed6-018902592f9b` at commit eb1ae2a: valid, all cases SWHR-C-0441..0447 `stub_failure` (the sentinel builder was a stub).

## Green run

Platform run `01d0cf38-c80d-4c01-8cd3-9ac7d2c9f142` at commit 54a222f: valid, all 7 cases `pass`, no reasons cited (no stub-sentinel match reported, so no platform follow-up F1 evidence needed).

Full gate on the green commit: `bun run lint` exit 0, `bun run typecheck` exit 0, `bun run test` 131 files / 629 tests passed.

## Notes

- "Caught" probe: a temporary `artifacts/SWHR-S-9999/notes.md` quoting the sentinel made `[SWHR-C-0443]` fail with `expected [ 'artifacts/SWHR-S-9999/notes.md' ] to deeply equal []`; the file was removed and not committed.
- A repo-wide search of `artifacts/`, `openspec/`, `.vortex/` and root Markdown finds no literal sentinel.
