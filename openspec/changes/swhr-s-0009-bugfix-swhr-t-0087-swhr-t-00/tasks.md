## 1. Schema upgrade preserves existing data

- [x] 1.1 Add `migrateDatabase` (enforcement OFF → migrate → ON → foreign-key check) and call it from `db/client.ts` (SWHR-T-0087)
- [x] 1.2 Cover upgrade-from-0004, enforcement, length checks, dangling reference and fresh database in `lib/db/migrate.test.ts` (SWHR-T-0087)

## 2. End-to-end browser matches the pinned test runner

- [x] 2.1 Bump `@playwright/test` to 1.60.x, regenerate the lockfile, adapt config/specs only where the suite breaks (SWHR-T-0072)
- [x] 2.2 Run the browser preflight and the full E2E suite in the standard container (SWHR-T-0072)

## 3. End-to-end tests produce test evidence

- [ ] 3.1 Add `mergeJunitReports` with unit tests (SWHR-T-0070)
- [ ] 3.2 Add `scripts/test-evidence.ts` + `test:evidence` script and point `testEvidence.command` at it (SWHR-T-0070)
- [ ] 3.3 Record the reasons from this ticket's own green evidence run as the live check (SWHR-T-0070)
