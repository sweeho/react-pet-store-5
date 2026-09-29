---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0015
idea: SWHR-I-0012
branch: vortex/sprint/swhr-s-0015-781fce36
downstream: [artifacts/SWHR-S-0015/qa-test-report.md]
---

# Integration test result — SWHR-S-0015

Command: `bun install` → `bun run build` (exit 0) → `bun run test:e2e` (Playwright, project chromium; `playwright test --list` shows 74 tests in 16 files, all chromium).

Summary line: `74 passed (36.0s)`

| Spec                                                                     | Result    |
| ------------------------------------------------------------------------ | --------- |
| e2e/supplier-inventory.spec.ts (4 tests: C-0405, C-0408, C-0412, C-0406) | 4 passed  |
| all other 15 spec files (70 tests)                                       | 70 passed |

No test skipped; no spec file ran zero tests. No failures.

E2E-RESULT: chromium 74 passed, 0 failed, 0 skipped
