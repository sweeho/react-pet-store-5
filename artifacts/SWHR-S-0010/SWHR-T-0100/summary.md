# SWHR-T-0100 summary

Added the scenario-level harness for the shopping cart; no production code changed.

- `routes/api/cart/scenarios.test.ts`: real handlers, one session carried by cookie. Route-level [SWHR-C-0238] (sign-out empties a 3-line cart), [SWHR-C-0248] ('abc' removes EST-6), [SWHR-C-0252] (price change shows 2000), plus a two-session isolation test.
- `e2e/cart.spec.ts`: anonymous en_US journey. [SWHR-C-0234] Remove, [SWHR-C-0235] Update Cart (one PATCH carrying both quantities), [SWHR-C-0236] Check Out.
- [SWHR-C-0246] and the rest of C-0232..0256 were already titled in `lib/cart/lines.test.ts` and `src/pages/cart.test.tsx`, so those files are unchanged.

Deviations: (1) [SWHR-C-0236] asserts `/signin` because the case precondition says signed-on but checkout is gated, and the plan says the sign-in page is shown for anonymous `/checkout`. (2) The e2e adds items via `page.request` rather than through the UI, to keep each test to its own cart.

Red: not achievable. The behaviour was delivered by SWHR-T-0097..0099, so every new test passes on first run; the platform rejected the red run (id 5af25b7a) for that reason. No stub can make a tests-only ticket red without weakening the tests.

Verification: `bun run verify:full` passed (unit suite, and 62 e2e tests including the 3 new ones). CI green.
