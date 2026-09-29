# TDD result — SWHR-T-0123

## Test cases

Linked cases SWHR-C-0293, 0297–0299, 0309–0312, 0320–0323, 0326, 0328–0339 (25 cases), each cited in a test title in `src/components/admin/orderData.test.ts`, `SalesCharts.test.tsx`, `src/pages/admin/orders.test.tsx` and `console.test.tsx`.

## Notes

Platform-recorded runs. Red run id: cca0d95b-3bff-4ad9-a199-8753bf63c8c6 (all cases failed on the stub). Green run id: f3b96065-791e-4db7-aa1f-dcd166dab4aa (all cases pass).

One test edit after red: in `orders.test.tsx` the [SWHR-C-0312] Approve-disabled assertion gained `hidden: true`, because the Fatal Error modal makes the page behind it inert. The assertion itself is unchanged. The other failing check (row names in [SWHR-C-0335]) was fixed in the implementation with a per-row `aria-label`.

Full gate `bun run verify`: exit 0, 174 files, 880 tests passed. `bun run test:e2e -- e2e/sign-on.spec.ts`: 8 passed.
