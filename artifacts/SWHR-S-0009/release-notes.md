---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0009
idea: none
branch: vortex/sprint/swhr-s-0009-c9813735
upstream: [artifacts/SWHR-S-0009/qa-test-report.md, artifacts/SWHR-S-0009/sprint-summary.md]
---

# Release notes — SWHR-S-0009

## Fixed

- **Existing databases upgrade again.** A deployment whose database already held catalogue data could not start after migration 0005: it stopped with "FOREIGN KEY constraint failed". The upgrade now applies every pending migration and keeps every row, and foreign keys are enforced again once it finishes. Fresh databases are unaffected. (SWHR-T-0087)
- **Startup refuses broken references.** If a database holds a row pointing at a missing parent after migrating, startup fails with an error naming the table instead of running on inconsistent data. (SWHR-T-0087)
- **End-to-end tests run in the QA/agent container.** The Playwright test runner now matches the browser that container ships, so the E2E preflight passes and the suite runs. (SWHR-T-0072)
- **End-to-end test cases get test evidence.** The test-evidence command now runs the Playwright suite as well as the unit and integration suites, and writes one report naming each e2e result by its `e2e/…` path. With no browser installed it skips E2E and says so. (SWHR-T-0070)

## Changed

- `@playwright/test` `~1.50.0` → `~1.60.0` (Chromium revision 1223). A local machine with the old browser needs `bun x playwright install chromium` once. CI already installs the matching browser.
- New package script `test:evidence`; `.vortex/config.yaml` `testEvidence.command` now runs it. The report path is unchanged.
- CI's evidence upload now names `.vortex-results/junit.xml` and `.vortex-results/e2e-junit.xml` explicitly; the folder upload had carried nothing.

## Upgrade notes

- No manual database step. Opening an existing database applies the pending migrations. If startup reports a dangling reference, fix the named table's rows and restart.
