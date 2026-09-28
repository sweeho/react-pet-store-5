# Generated corrections to AGENTS.md

AGENTS.md is human-authored; these notes record where it is about to drift from the code. A human folds them in.

- **Test placement (from SWHR-S-0002, change `swhr-i-0003-localization`).** AGENTS.md says only `routes/**/*.test.ts` runs in the Vitest `server` project. SWHR-T-0013 adds `lib/**/*.test.ts` to that project and `lib` to `tsconfig.node.json`; tests for server/shared modules under `lib/` belong there.
