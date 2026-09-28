## 1. Data model

- [x] 1.1 Add the `users` credential table (user id primary key, password hash) to the `db/` schema and generate its `drizzle/` migration (SWHR-T-0042)
- [x] 1.2 Add the `sessions` table (id, user id, signed-on flag, original URL, locale, realm, last-seen) and generate its migration (SWHR-T-0042)
- [x] 1.3 Add an administrator role assignment (user or group to role) to the schema and seed the administrator and supplier principals (SWHR-T-0042)

## 2. Credential rules

- [x] 2.1 Implement the user id validator: maximum 25 characters, no `%` or `*` (SWHR-T-0043)
- [x] 2.2 Implement the password maximum-length check, blocked on recovering the redacted value (OQ-1) (SWHR-T-0043)
- [x] 2.3 Implement credential creation, mapping a primary-key conflict to a duplicate-user-id error (SWHR-T-0043)
- [x] 2.4 Implement authentication: exact, case-sensitive match, where an unknown user id returns false without raising (SWHR-T-0043)
- [x] 2.5 Implement password hashing and verification, and make sure no password is ever logged (OQ-2) (SWHR-T-0043)

## 3. Sessions and the protected-page gate

- [x] 3.1 Implement the session cookie, session lookup and per-realm idle timeout (storefront 15 min, admin and supplier 54 min) (SWHR-T-0044)
- [x] 3.2 Define the protected-page configuration (sign-on page, error page, named protected paths with roles), where the first entry wins on a duplicate name and the duplicate is logged (SWHR-T-0044)
- [x] 3.3 Implement the server middleware gate with exact path matching that ignores query strings, and store the original URL (SWHR-T-0044)
- [x] 3.4 Implement the SPA route guard for protected pages, backed by a session-state endpoint (SWHR-T-0044)
- [x] 3.5 Make sure catalog, search and cart routes carry no sign-on requirement (SWHR-T-0044)

## 4. Sign-on, registration and sign-out API

- [x] 4.1 Add the sign-on route: authenticate, set or clear the 31-day remember cookie, mark the session signed on, return the original URL (SWHR-T-0045)
- [x] 4.2 Add the create-credential route, which refuses to create when the user name or password is absent and continues to the account-information form (SWHR-T-0045)
- [x] 4.3 Wire customer-profile completion to mark the session signed on and return to the original URL, or home when it was the account-change action (SWHR-T-0045)
- [x] 4.4 Add the sign-out route: rotate the session, keep the locale, start an empty cart (SWHR-T-0045)

## 5. Storefront screens

- [ ] 5.1 Build the sign-in page with the returning-customer and new-account forms, remembered-name pre-fill and the empty-field check (SWHR-T-0046)
- [ ] 5.2 Build the sign-in error page (SWHR-T-0046)
- [ ] 5.3 Build the user-creation error page for a duplicate or invalid user id (SWHR-T-0046)
- [ ] 5.4 Build the signed-out page with a link to sign in again (SWHR-T-0046)
- [ ] 5.5 Build the storefront header component (logo, search, Account, Cart, and Sign in or Sign out by session state) (SWHR-T-0046)

## 6. Administrator and supplier access

- [ ] 6.1 Implement the `requireRole("administrator")` guard for admin console and supplier routes (SWHR-T-0047)
- [ ] 6.2 Build the administrator sign-in form and login-error page with a link back to sign in (SWHR-T-0047)
- [ ] 6.3 Implement administrator and supplier sign-out, returning to the respective landing page (SWHR-T-0047)
- [ ] 6.4 Make the admin data service reply with a session-timed-out error when called without a session (SWHR-T-0047)
- [ ] 6.5 Make the supplier inventory page show a not-authorised message and no update form to users without the role (SWHR-T-0047)
- [ ] 6.6 Decide and implement the session-bound admin client launch, or its browser equivalent (OQ-6) (SWHR-T-0047)

## 7. Tests

- [ ] 7.1 Unit-test the user id and password validators, including the 25 and 26 character boundaries and the wildcard characters (SWHR-T-0048)
- [ ] 7.2 Integration-test the sign-on, create-credential and sign-out routes, including duplicate, case-sensitive and unknown-user cases (SWHR-T-0048)
- [ ] 7.3 Integration-test the gate: exact matching, query strings, signed-on pass-through, idle timeout (SWHR-T-0048)
- [ ] 7.4 UI-test the sign-in page, the error pages and the header state switch (SWHR-T-0048)
- [ ] 7.5 Add an E2E spec: anonymous checkout gated, registration, return to checkout, sign out keeps the language and empties the cart (SWHR-T-0048)
