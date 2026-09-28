---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0004
idea: SWHR-I-0005
branch: vortex/sprint/swhr-s-0004-cb2d4596
upstream: [artifacts/SWHR-S-0004/qa-test-report.md]
---

# Release notes — SWHR-S-0004

## Added

- **Sign in and create an account** from one screen. A form won't submit with an empty field and names the field that is empty. "Remember My User Name" pre-fills the user name for 31 days. (SWHR-T-0045, SWHR-T-0046)
- **Two-step registration.** Step 1 is a user name and password, step 2 is the account-information form. At the end the shopper is signed in and taken back to where they were going, or to Home when they came from account editing. (SWHR-T-0045, SWHR-T-0046)
- **Sign-in only where needed.** Account, account editing, checkout and the sign-in welcome page ask the shopper to sign in, then return them to the page they asked for. Catalogue, search and cart never ask. (SWHR-T-0044)
- **Clear failures.** Wrong credentials show "Sign-in Error". A taken user name shows "User Creation Error". User names are at most 25 characters and can't contain `%` or `*`. Passwords are case-sensitive. (SWHR-T-0043, SWHR-T-0046)
- **Sign out.** Signing out empties the cart, keeps the chosen language and shows "You are signed out" with a link to sign in again. (SWHR-T-0045, SWHR-T-0046)
- **The header shows Sign in or Sign out**, on desktop and in the mobile menu. (SWHR-T-0046)
- **Add to Cart and a cart page** for anonymous shoppers, stored per session. (SWHR-T-0044, SWHR-T-0046)
- **Administration sign-in.** The console admits only the administrator role, directly or through the administrator group, and refuses everyone else. It has a login error page, and sign-out returns to the public administration landing page. The order-data service reports an expired session and asks the administrator to sign in again. (SWHR-T-0047)
- **Supplier sign-in.** Staff without the administrator role see "not authorised" and no update form. Log out shows a page linking back in. (SWHR-T-0047)
- **Idle timeouts:** 15 minutes for shoppers, 54 minutes for staff. (SWHR-T-0044, SWHR-T-0047)

## Changed

- The administration and supplier landing pages are no longer "coming soon" placeholders. (SWHR-T-0047)
- The search page now states the keyword searched for. (SWHR-T-0048)
- The boilerplate demo users and `GET /api/users` endpoints are gone. `POST /api/users` now creates a sign-on credential. (SWHR-T-0042, SWHR-T-0045)

## Upgrade notes

- New migration `drizzle/0004_lonely_pete_wisdom.sql` **drops and recreates `users` and `profiles`**. It also adds `sessions`, `customers`, `cart_lines`, `role_assignments` and `group_members`. It applies automatically at startup. Existing rows in `users`/`profiles` are lost; before this sprint those were boilerplate demo data only.
- Outside production, startup seeds the staff users `jps_admin`, `supplier` and `admin_member`. Each one's password is its user id. Nothing is seeded in production, so staff accounts there must be provisioned by hand until SWHR-T-0049 is ruled on.
- New optional settings:
  - `SQLITE_PATH` — database file, default `sqlite.db` in the working directory.
  - `SIGNON_CONFIG_PATH` — protection config, default `configs/signon-config.json`.
  - `SIGNON_PASSWORD_MAX_LENGTH` — password maximum, default 25 (provisional).
- Operators can change which storefront pages need sign-in by editing `configs/signon-config.json`, with no release.

## Not included

- The account, account-editing and checkout pages themselves. They arrive with the customer-account and checkout ideas, and the gate already protects their paths.
- A rich order-management client. "Manage orders" returns a session-bound launch descriptor only.
- The supplier inventory update form.
- Rulings pending in SWHR-T-0049: the password maximum, legacy password rehash, the remember cookie on a failed sign-in, the repeated-password check and production staff provisioning.
- The sign-in screen does not pre-fill demo credentials, though PRODUCT.md behaviour 16 says it should. That conflict awaits a PRD ruling.

## Known issues

- SWHR-T-0050 — `bun run dev` returns 500 on any route that reads the database. The defect is pre-existing and does not affect the built server, tests or CI.

## Verification

Verified at integration QA: 49/49 scenarios, 494 unit tests and 36/36 E2E tests pass. See [qa-test-report.md](qa-test-report.md) (PASS).

## Compliance / Control Evidence

| Control                      | Evidence                   | Location                                  | Status    | Exception |
| ---------------------------- | -------------------------- | ----------------------------------------- | --------- | --------- |
| Release contents recorded    | this file                  | `artifacts/SWHR-S-0004/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict            | `artifacts/SWHR-S-0004/qa-test-report.md` | Satisfied | —         |
| Known limitations disclosed  | Not included, Known issues | this file; SWHR-T-0049, SWHR-T-0050       | Satisfied | —         |
