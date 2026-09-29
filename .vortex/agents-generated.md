# Generated corrections to AGENTS.md

AGENTS.md is human-authored; these notes record where it is about to drift from the code. A human folds them in.

- **Test placement (from SWHR-S-0002, change `swhr-i-0003-localization`).** AGENTS.md says only `routes/**/*.test.ts` runs in the Vitest `server` project. SWHR-T-0013 adds `lib/**/*.test.ts` to that project and `lib` to `tsconfig.node.json`; tests for server/shared modules under `lib/` belong there.
- **Middleware test placement (from SWHR-S-0004, change `swhr-i-0005-sign-on-and-access-control`).** SWHR-T-0044 adds `middleware/**/*.test.ts` to the Vitest `server` project, because `middleware/signon.ts` reaches `bun:sqlite`. Tests for `middleware/` belong there, not in `client`.
- **Database path (from SWHR-S-0004).** AGENTS.md's gotcha says `db/client.ts` always resolves `sqlite.db` from `process.cwd()`. SWHR-T-0042 adds `SQLITE_PATH` to point it elsewhere, and SWHR-T-0048 uses it to give Playwright a fresh database per run.
- **Sentinel wording in artifact prose (from SWHR-S-0006, SWHR-T-0064).** Refer to the stub-sentinel value as "the configured stub sentinel" in `artifacts/**` prose — do not quote its literal text there. Live stubs in source/test files are unaffected and keep throwing the literal string.
