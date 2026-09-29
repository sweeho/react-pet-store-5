# TDD result — SWHR-T-0083

## Test cases

SWHR-C-0223, 0224, 0225 (unit, `AccountForm.test.tsx`); SWHR-C-0230, 0231 (e2e in `e2e/account.spec.ts`, plus page-level twins in `src/pages/account.test.tsx` that the recorded run can see). Extra uncited tests: `useAccount`, `account-edit`, `register` pages.

## Notes

- Red run: `8df22143-c722-424c-935b-e9dbb49529ad` — valid (0223–0225 failed on the stub, 0230/0231 on assertions). Earlier reds were invalid: the recorded command runs Vitest only, so an e2e-only citation is never in the report; I cited 0230/0231 from page tests as well. `src/pages/account.tsx` cannot be stubbed (existing production file), so those tests wait with assertion-style `waitFor`.
- Green run: `63255e01-e450-4d36-bbc0-fa2de9839646` — valid, all 5 cases pass.
- Full gate `bun run verify` exit 0: 142 files, 691 tests passed.
- E2E: `bun run test:e2e` could not run here (Chromium is not installed in this container; the preflight fails). `e2e/account.spec.ts` and the updated registration helper in `e2e/sign-on.spec.ts` are unexecuted; Validation/CI runs them.
