# SWHR-T-0162 summary

Tests only, all under `lib/notifications/scenarios/`:

- `harness.ts`: clears the in-memory database and registers every real consumer (intake, approval, supplier-intake, fulfilment, the three customer-notification consumers, the mailer on a caller-supplied transport), plus `runGeneralPass` / `runMailPass` (the same `except` / `only` calls the two plugins make) and `settleAll`.
- `customer-notifications.test.ts`: SWHR-C-0417 (four e-mails: approval, two shipments, completion), SWHR-C-0420 (approval APPROVED while the send is blocked; e-mail captured after release), SWHR-C-0426 (send throws: one attempt, logged, delivery `delivered`, nothing resent, order APPROVED).
- `coverage.test.ts`: literal list of SWHR-C-0001 and SWHR-C-0413 to 0430, each required in a test title under `lib/` or `plugins/`. All 19 are currently cited.

No gap tests were needed beyond these (step 4). AC-5: the `lib/b2b/scenarios/` suites pass unchanged; the new scenarios run the same flow with the notification consumers registered.

Verification: `bun run verify` exit 0 (1073 tests passed); recorded red and green runs for SWHR-C-0417, 0420, 0426.
