# TDD result — SWHR-T-0081

## Test cases

17 approved cases SWHR-C-0193, 0195, 0200, 0202–0206, 0208–0216, each cited in a test title in `lib/account/{expiry,contactInfo,customer}.test.ts`. One extra uncited test covers deleteCustomer's cascade.

## Notes

- Red run: `602fe765-6578-439c-bf83-1ea762b1325c` — valid, all 17 cases failed on the stub. An earlier red (`b743e3c9…`) was invalid (types.ts committed early; a rollback test passing on the stub; duplicate user ids across tests); fixed and re-run.
- Green run: `982fbfef-31c2-48d1-b052-b2ac06817920` — valid, all 17 cases pass.
- The platform flagged `customer.test.ts` as modified after red: I appended the uncited cascade-delete test; no cited test changed.
- Full gate `bun run verify` exit 0: 137 files, 660 tests passed.
