# SWHR-T-0124 summary

Added `e2e/order-approval.spec.ts`: Launch Rich Client (SWHR-C-0324), logout (SWHR-C-0325), Exit with an uncommitted mark leaves the order PENDING (SWHR-C-0300), approve, commit and refresh moves the order to non-pending (SWHR-C-0327), and a Sales bar chart reload plus malformed-date rejection (task 6.2, no case key). Added `signInAsAdmin` and `placeZhCnOrder` to `e2e/account-helpers.ts`.

Intake stores orders asynchronously, so the spec polls with Refresh or Get Data via `toPass`.

Finding: a checkout with a blank e-mail makes `order-intake` fail forever ("EmailId element: content expected."), so the order is never stored. The helper fills the checkout e-mail fields to avoid it; a defect was raised.

Verification: `bun run verify:full` passed (176 unit files / 899 tests, 69 E2E tests). Design not consulted beyond PLAN: no UI code changed.
