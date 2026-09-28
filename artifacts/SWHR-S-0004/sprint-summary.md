---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0004
idea: SWHR-I-0005
branch: vortex/sprint/swhr-s-0004-cb2d4596
upstream:
  [
    artifacts/SWHR-S-0004/SPRINT-PLAN.md,
    artifacts/SWHR-S-0004/qa-test-report.md,
    artifacts/SWHR-S-0004/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0004/release-notes.md]
---

# Sprint summary — SWHR-S-0004

## Tickets

| Ticket      | Type  | Title                                                                                                     | Outcome                                        |
| ----------- | ----- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| SWHR-T-0039 | TASK  | Sprint plan — SWHR-S-0004                                                                                 | DONE (commit 610384e)                          |
| SWHR-T-0040 | EPIC  | Sign-on and access control — shopper accounts, protected pages and staff-only admin and supplier access   | DONE (rollup)                                  |
| SWHR-T-0041 | STORY | Shoppers sign in only where needed and return to their page; staff reach admin and supplier only as admin | DONE (rollup)                                  |
| SWHR-T-0042 | TASK  | Data model — credential, session, role, customer and cart-line tables, staff seeds                        | DONE (#28) — [summary](SWHR-T-0042/summary.md) |
| SWHR-T-0043 | TASK  | Credential rules — user id and password checks, hashing, creation and authentication                      | DONE (#29) — [summary](SWHR-T-0043/summary.md) |
| SWHR-T-0044 | TASK  | Sessions and the protected-page gate                                                                      | DONE (#30) — [summary](SWHR-T-0044/summary.md) |
| SWHR-T-0045 | TASK  | Sign-on, registration and sign-out API                                                                    | DONE (#31) — [summary](SWHR-T-0045/summary.md) |
| SWHR-T-0046 | TASK  | Storefront screens — sign-in, errors, signed-out, welcome, registration, header state, cart seam UI       | DONE (#32) — [summary](SWHR-T-0046/summary.md) |
| SWHR-T-0047 | TASK  | Administrator and supplier access                                                                         | DONE (#33) — [summary](SWHR-T-0047/summary.md) |
| SWHR-T-0048 | TASK  | Sign-on test suite — approved test-case coverage audit and E2E journeys                                   | DONE (#34) — [summary](SWHR-T-0048/summary.md) |
| SWHR-T-0051 | TASK  | Integration QA report — SWHR-S-0004                                                                       | DONE (#35), verdict PASS                       |
| SWHR-T-0052 | TASK  | Sprint close bundle — SWHR-S-0004                                                                         | this file                                      |

## What shipped

Sprint goal "SWHR-I-0005: Sign-on and access control" is met. The store can now tell who a visitor is:

- **Shopper accounts.** One sign-in screen holds a returning-customer form and a new-account form. User ids are at most 25 characters with no `%` or `*`. Passwords are case-sensitive and hashed with argon2id (`lib/auth/credentials.ts`, `lib/auth/password.ts`). Registration takes two steps, a credential and then account information, and signs the shopper on at the end. "Remember My User Name" sets a 31-day cookie.
- **Sign-in only where needed.** `/account`, `/account-edit`, `/checkout` and `/signon-welcome` are protected through `configs/signon-config.json`. Matching is exact on the path. One gate (`checkGate`) serves the SPA, the document middleware and the API routes, and it returns the shopper to the page they asked for. Catalogue, search and cart stay anonymous. A new session-scoped cart API (`GET /api/cart`, `POST /api/cart/items`) proves this.
- **Sign-out and timeouts.** Signing out empties the cart but keeps the language. Storefront sessions end after 15 minutes idle and staff sessions after 54 minutes.
- **Staff realms.** Administration and supplier inventory each have their own sign-in, login-error and sign-out pages. Only the `administrator` role gets in, granted directly or through `administrator_group`. The admin order-data service needs a signed-on session and reports a timeout when the session has expired. The console returns a session-bound launch descriptor.
- **Data.** Migration `drizzle/0004_lonely_pete_wisdom.sql` reshapes `users`/`profiles` into credentials and adds `sessions`, `customers`, `cart_lines`, `role_assignments` and `group_members`.

As in earlier sprints, some parts are seams whose callers belong to later ideas. The account, account-edit and checkout pages that the gate protects are owned by customer-account and checkout. The "Manage orders" launch shows a descriptor, and no rich client consumes it (OQ-6). Supplier inventory shows the role gate but has no update form behind it yet.

## Divergence from plan

- **The migration was hand-authored** (SWHR-T-0042). `drizzle-kit generate` needs an interactive TTY for rename-vs-recreate prompts, and the container has none. The SQL and snapshot follow drizzle-kit's format. They were checked by applying them to a fresh database and to a pre-sprint database. The next `db:generate` will show whether the snapshot drifted.
- **`useSignOnSession.tsx`, not `.ts`** (SWHR-T-0046). The file exports a JSX provider. Only the extension differs from the design.md contract.
- **`src/pages/search.tsx` edited outside SWHR-T-0048's ownership map.** SWHR-C-0106 needs the search page to state the keyword, and the placeholder never did. The fix adds one conditional heading.
- **`e2e/smoke.spec.ts` probe repointed** (SWHR-T-0042) from the deleted `GET /api/users` to `GET /api/catalog/products/BULLDOG`, so the Bun-import regression check was kept.
- **The sign-in screen omits the mockup's `j2ee`/`j2ee` pre-fill** (design SD-5, OQ-8). This was deliberate. PRODUCT.md decided behaviour 16 still states the pre-fill, and that contradiction is open (see Open decisions).
- Otherwise delivered to plan. No ticket was added, split or dropped.

## Verification

PASS. Lint, typecheck and 494 unit tests pass (112 files). All 36 Playwright tests pass, including the 8 sign-on journeys, and all 49 scenarios of change `swhr-i-0005-sign-on-and-access-control` pass against approved cases SWHR-C-0099–SWHR-C-0147. No defects were found in integration. See [qa-test-report.md](qa-test-report.md), [integration-test-result.md](integration-test-result.md) and [integration-defects-resolution.md](integration-defects-resolution.md).

## Defects Raised

- **SWHR-T-0050** (BACKLOG, P2) — `bun run dev` returns 500 on any route that reaches `db/client.ts`. The defect is pre-existing and reproduces on the base branch. Tests, the E2E server and CI are unaffected.

## Open decisions

SWHR-T-0049 (BACKLOG) asks a human for rulings. The shipped code follows design.md's provisional reading of each:

- the password maximum (OQ-1): `SIGNON_PASSWORD_MAX_LENGTH`, default 25
- how migrated legacy plaintext passwords are rehashed (OQ-2)
- whether a failed sign-on should still write the remember cookie (OQ-4): it does, as in the legacy system
- whether the repeated password is compared (OQ-7): it is not
- how staff accounts are provisioned in production: seeds run outside production only

The pre-fill conflict between PRODUCT.md behaviour 16 and design OQ-8/SD-5 also needs a PRD ruling.

## Retrospective

- **Went well:** design.md fixed the interface contracts (`credentials.ts`, `session.ts`, `protection.ts`, the HTTP surface) before any code was written. Seven tickets built on each other in order with no contract change, and QA's code review found both modules matching the contract exactly.
- **Went well:** the SWHR-S-0003 retrospective asked that test-project config go in the ownership map of any ticket that adds a server-side test root. SWHR-T-0044's plan did this for `middleware/**`, and no ticket edited `vitest.config.ts` unplanned.
- **Could improve:** for the fourth sprint running, no implementation container could run Playwright. This time the pinned `@playwright/test@~1.50` wants `chromium-1155` and the image ships `chromium-1223`. It mattered on this UI-heavy sprint: SWHR-T-0048 needed two CI round trips to fix label substring matches, a locale-switch race and retry collisions on created user names. Aligning the Playwright pin with the image's browser would let those be caught locally.
- **Could improve:** the plan put the search-page change (SWHR-C-0106) in the test ticket but left `src/pages/search.tsx` out of its ownership map. When an E2E case needs a behaviour that a placeholder page lacks, planning should list that page.

## Compliance / Control Evidence

| Control                        | Evidence                                                    | Location                                                                                                                   | Status    | Exception                                              |
| ------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------ |
| Work planned before execution  | Change proposal, design, specs, tasks; per-ticket PLAN.md   | `openspec/changes/swhr-i-0005-sign-on-and-access-control/` (archived at close), `artifacts/SWHR-S-0004/SWHR-T-00*/PLAN.md` | Satisfied | —                                                      |
| Tests executed per ticket      | TDD results                                                 | `artifacts/SWHR-S-0004/SWHR-T-00{42..48}/tdd-test-result.md`                                                               | Satisfied | E2E ran only in CI and QA (container browser mismatch) |
| Change verified before release | QA report, PASS, 49/49 scenarios                            | `artifacts/SWHR-S-0004/qa-test-report.md`                                                                                  | Satisfied | —                                                      |
| Defects dispositioned          | 0 integration defects; 1 pre-existing defect filed          | `artifacts/SWHR-S-0004/integration-defects-resolution.md`, SWHR-T-0050                                                     | Satisfied | SWHR-T-0050 open in BACKLOG                            |
| Open decisions tracked         | Rulings ticket                                              | SWHR-T-0049                                                                                                                | Satisfied | Rulings pending                                        |
| Credential handling            | Passwords hashed (argon2id), never logged                   | `lib/auth/password.ts`; design.md P2                                                                                       | Satisfied | Legacy password migration not yet ruled (OQ-2)         |
| Release approval               | Sprint reached SPRINT_CLOSE via `validation.all_acs_passed` | SWHR-T-0051                                                                                                                | Satisfied | Human approver: Not Provided                           |
