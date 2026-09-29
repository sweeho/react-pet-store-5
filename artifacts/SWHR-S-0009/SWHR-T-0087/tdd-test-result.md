# TDD result — SWHR-T-0087

## Notes

Regression tests: `lib/db/migrate.test.ts`, one test per case SWHR-C-0448 to SWHR-C-0452.

- Red run id: d6482357-ec13-4ade-aec6-ff6d1b542187 (commit feb3b80, all five cases fail on the stub).
- Green run id: c738c2cf-4695-4523-a118-66d4090ba02d (commit dcc89af, all five cases pass).
- After red, the SWHR-C-0448 comparison changed from exact equality to subset match: migration 0005 adds `itemDetails.attr1..5`, so exact equality could never hold. Row counts and every pre-upgrade column value are still asserted.

Full gate `bun run verify` (lint, typecheck, unit): 146 files, 711 tests passed, exit 0.
