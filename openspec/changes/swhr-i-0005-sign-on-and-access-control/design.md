# Design: sign-on (extracted from Java Pet Store 1.3.2)

## Context

Sign-on covers four areas:

- storefront credentials, sign-on and sign-out, and the protected-page gate
- two-step customer registration
- the separate, container-managed administrator sign-in used by the admin console and the supplier application
- declarations that other components (catalog, cart, purchase order, supplier PO) are deliberately open to anonymous or internal callers

Source: the pass files under `legacy-analysis/ir/_passes/`. There are 68 pass records with `capability_key: sign-on` (the A and B passes of each module), which reconcile to the 36 ingested records. They come from `components/signon`, `apps/petstore`, `apps/admin`, `apps/supplier`, `components/cart`, `components/catalog`, `components/purchaseorder`, `components/supplierpo`, `waf` and `docs`. Five raw screen records reduce to three screens: sign-in, sign-in error and storefront header. Points beyond the IR were checked in `legacy-source/` and carry their trace.

The customer profile form that completes registration belongs to `customer-account`. This capability owns only the credential step and the moment the session becomes signed on.

## Legacy implementation notes (not requirements)

### Storefront sign-on (`components/signon`, WAF `SignOnFilter`)

- `SignOnFilter` is mapped to `/*` (`apps/petstore/.../WEB-INF/web.xml:61-79`). `init` loads `/WEB-INF/signon-config.xml` through `SignOnDAO` (`SignOnFilter.java:88-102`, `SignOnDAO.java:127-163`).
- Session attributes:
  - `j_signon`: Boolean signed-on flag, initialised to false
  - `j_signon_username`
  - `j_signon_original_url`
- `targetURL` is the request URI after the first `/` following the context root (`SignOnFilter.java:114-116`). Matching is `urlPattern.equals(targetURL)` (`:145`).
- The form posts to the pseudo-path `j_signon_check`, which the filter intercepts (`:118-122`). `validateSignOn` (`:160-210`) runs in this order:
  1. writes or clears the `bp_signon` cookie (maxAge 2678400 s, 31 days)
  2. calls `SignOnEJB.authenticate`
  3. on success, sets the session attributes and redirects to `j_signon_original_url`; on failure, redirects to `signon_error.screen`
- `SignOnEJB.authenticate` returns `UserLocal.matchPassword`, which is `password.equals(getPassword())`. A `FinderException` returns false (`SignOnEJB.java:71-78`, `UserEJB.java:88-90`).
- `UserEJB.ejbCreate` checks (`UserEJB.java:63-76`):
  - length > `MAX_USERID_LENGTH` (25), rejected with "User ID cant be more than 25 chars long"
  - length > `MAX_PASSWD_LENGTH` (value redacted)
  - `%` or `*` in the user id
  - Duplicates fail on the `userName` primary key (`ejb-jar.xml:65`; DDL `UserEJBTable PRIMARY KEY (userName)`, `apps/petstore/src/sun-j2ee-ri.xml:418`).
- The four protected storefront resources are `customer.screen`, `customer.do`, `enter_order_information.screen` and `signon_welcome.screen` (`signon-config.xml:49-79`). The header's "Sign in" link targets `signon_welcome.screen`. Because that page is protected, clicking Sign in always stores an original URL, and a successful sign-on lands on the welcome screen.
- `components/signon` also ships a standalone `CreateUserServlet` that redirects to `user_creation_error.jsp` on failure. The storefront does not use it. Storefront creation goes through `createuser.do`, which runs `CreateUserHTMLAction` then `CreateUserEJBAction`, maps `CreateException` to `DuplicateAccountException` and shows `duplicate_account.screen` (`mappings.xml:86-95,111`). The spec states the storefront behaviour.

### Registration (`apps/petstore`)

- `createuser.do` → `create_customer.screen`, the customer-account form.
- `createcustomer.do` runs `CustomerEJBAction` CREATE. `CustomerHTMLAction.doEnd` sets `j_signon=true` (`CustomerHTMLAction.java:256-266`). `CreateUserFlowHandler` returns the original URL, or `MAIN_SCREEN` when that URL was `customer.do` (`CreateUserFlowHandler.java:64-73`).
- `CreateUserHTMLAction` reads `j_password` and `j_password_2`, but no code compares them (lines 76-78 are redacted). See OQ-7.

### Sign-out

`SignOffHTMLAction` (`SignOffHTMLAction.java:69-82`) runs these steps:

1. saves the locale
2. invalidates the session
3. creates a new session and restores the locale
4. re-initialises the component manager, which creates a new cart

`signoff.do` maps to `signoff.screen` (`signoff.jsp`).

### Screens

- **Sign-in:** `signon.jsp`. The fields are `j_username`, `j_password` and `j_remember_username`, posted to `j_signon_check`, and `j_username`, `j_password` and `j_password_2`, posted to `createuser.do`.
- **Sign-in error:** `signon_failed.jsp`, reached through `signon_error.screen`.
- **Header:** `banner.jsp`, included by every screen definition (`screendefinitions_en_US.xml:45-53`).
- **Empty-field check:** client-side only. It is the WAF `waf:form`/`waf:input validation=` JavaScript (`FormTag.java:87-111`), and no server-side counterpart exists.
- **Demo defaults:** with no cookie present, `signon.jsp` pre-fills the returning-customer form with the demo credentials `j2ee`/`j2ee`. This is sample-data scaffolding, and the spec deliberately does not require it (see OQ-8).

### Administrator and supplier sign-in

- **Mechanism:** container FORM authentication.
  - Admin: `apps/admin/.../web.xml:75-101`, with `login.jsp` and `error.jsp`.
  - Supplier: `apps/supplier/.../web.xml:91-117`.
  - Role mapping: `sun-j2ee-ri.xml:45-56` maps `jps_admin` and `administrator_group` in admin, and `supplier` and `administrator_group` in supplier.
- **Session timeout:** 54 minutes in both (`web.xml:67-69`, `:72-74`). The storefront timeout is 15 minutes (`petstore web.xml:161-163`).
- **Admin data service:** `ApplRequestProcessor` uses `getSession(false)`. Without a session it replies `<Error>Session Timed Out; Please exit and login as admin from the login page</Error>` (`ApplRequestProcessor.java:85-99`).
- **Admin client launch:** `AdminRequestProcessor` serves a JNLP whose arguments are the proxy class, host, port and session id. `HttpPostPetStoreProxy` then calls `/admin/ApplRequestProcessor;jsessionid=<id>` (`AdminRequestProcessor.java:55-118`, `HttpPostPetStoreProxy.java:74-78`).
- **Supplier inventory page:** `displayinventory.jsp` checks `isUserInRole("administrator")` a second time (`:65-71`, `:121-127`).
- **Open data components:** catalog, cart, purchaseorder, supplierpo and signon EJBs all declare `<unchecked/>` method permissions.

## Mapping to the rebuild stack

- **Data model.**
  - Add `users` to the `db/` schema (`db/schema.ts`, or a split file such as `db/schema/users.ts` if the project has adopted one): `userId text primary key`, `passwordHash text not null`.
  - Enforce the 25-character and `%`/`*` user id rules in the route through a shared validator, not a `CHECK`, so the error is reported cleanly.
  - `bun run db:generate` produces the migration in `drizzle/`.
  - Primary-key uniqueness gives the duplicate rule. Map the SQLite constraint error to the "User Creation Error" response.
- **Sessions.**
  - Add a `sessions` table (`id`, `userId` nullable, `signedOn` boolean, `originalUrl`, `locale`, `lastSeenAt`, `realm`), keyed by an HttpOnly cookie.
  - Idle timeout per realm: storefront 15 min, admin and supplier 54 min. Check it on each request against `lastSeenAt`.
- **Gate.**
  - A Nitro server middleware in `middleware/` checks the storefront path against the configured protected list by exact match on the path.
  - SPA navigation cannot be gated by server middleware alone. Protected pages are SPA routes, so the gate must also run in the page loader or a route guard that asks `/api/session` and redirects to `/signin`. The API routes behind protected pages must enforce it server-side.
  - Keep the protected list as a config module (a TS constant or JSON), per the "configurable without code change" requirement.
- **Routes.**
  - `routes/api/signon.post.ts`: authenticate, set the remember cookie, set the session, return the redirect target.
  - `routes/api/users.post.ts`: create the credential.
  - `routes/api/signoff.post.ts`: rotate the session, keep the locale, clear the cart.
  - `routes/api/session.get.ts`: header state.
- **Pages.** `src/pages/signin.tsx`, `src/pages/signin-error.tsx`, `src/pages/signed-out.tsx` and `src/pages/user-creation-error.tsx`. The header is a component in `src/components/`.
- **Admin and supplier realms.** Neither has an SPA surface elsewhere in the extraction yet. Implement role checks as a `requireRole("administrator")` helper used by their routes, and use a role column or table rather than container role mapping. The Java Web Start client launch has no equivalent in the pinned stack. See OQ-6.

## Disputed and open points (need a human decision)

- **OQ-1: password maximum length is redacted.** `UserLocal.java:47` holds a redaction marker. The requirement is kept, but its value must be recovered before implementation. Until then, the implementer should not invent a number.
- **OQ-2: plaintext passwords.** The legacy system stores and compares passwords in plaintext, and `CreateUserServlet.java:69` logs the password. The spec requires only an exact, case-sensitive match. The rebuild should hash the password (the `passwordHash` column above) and never log it. A human must confirm how migrated legacy passwords are rehashed.
- **OQ-3: storefront roles are parsed but never enforced.** `SignOnDAO` reads `role-name` values, but `SignOnFilter` never calls `getRoles()`. The spec records the legacy behaviour (roles ignored), so any role-restricted storefront page would need a decision.
- **OQ-4: remember-cookie is written before authentication.** A failed sign-on still stores the typed user name. The spec does not constrain the failure case. Decide whether to keep this.
- **OQ-5: direct sign-on with no original URL.** If `j_signon_check` is posted without a prior gated request, the redirect target is null. The storefront avoids this because the Sign in link targets a protected page. The rebuild should default to the home page. That default is not legacy behaviour and needs confirming.
- **OQ-6: admin client launch.** The session-bound launch descriptor (JNLP) is kept as a requirement for its behaviour: no second sign-in, and the session is carried. A browser-based admin UI satisfies it trivially. Confirm the rich client is out of scope.
- **OQ-7: password repeat is not verified.** `j_password_2` is collected, but no comparison survives in the redacted source. The spec does not require a match check. Decide whether the rebuild adds one.
- **OQ-8: exact path matching and demo defaults.** Exact matching (no wildcards) is kept, and marked low confidence by one pass. The `j2ee`/`j2ee` form pre-fill is excluded.
- **Excluded record.** `waf/a.yaml` `sign-on-requirement-0001` gives a 30-minute timeout. It comes from the WAF sample application's `web.xml` (`waf/src/docroot/WEB-INF/web.xml:100-102`), is flagged disputed, and is not the storefront. The storefront's 15 minutes is specified instead.
- **Cross-capability overlap.** The empty-field check is also specified in `customer-account` ("Empty-field check before submission"). Here it is stated only as part of the sign-in screen.

## Non-goals

- Customer profile content and validation, which belong to `customer-account`.
- Supplier inventory and order management behaviour beyond access control.
- Single sign-on across the storefront and the admin or supplier realms. The legacy system has none.
