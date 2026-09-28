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

## Planning (SWHR-S-0004)

Added at sprint planning (SWHR-T-0039). Everything above this heading is the adopted specification and is unchanged. This section records what the repository actually contains, the decisions that make the spec buildable on it, and how the work is phased. Implementation agents read this section before their `PLAN.md`. Mockups: `artifacts/SWHR-S-0004/design/` (index `MANIFEST.md`).

### Codebase findings

- **`users` already exists, and it is the boilerplate example table**: `id integer`, `name`, `email`, seeded with two demo rows in `db/client.ts`. It is served by the example routes `routes/api/users/{index.get,index.post,[id]}.ts` (plus tests), asserted by `e2e/smoke.spec.ts` (`GET /api/users`) and cited throughout `README.md`. `profiles.userId` is an **integer** foreign key onto it, and `lib/locale/preference.ts` takes `userId: number`.
- **A session already exists.** `lib/locale/session.ts` keeps the locale and cart locale in h3's sealed-cookie `useSession` (`SESSION_PASSWORD`). `middleware/locale.ts` loads it on every request. There is no server-side session store and no idle timeout.
- **`middleware/auth.ts` is boilerplate.** It sets `event.context.user = { name: "Yeasin" }` for `routes/api/hello.ts`. It authenticates nothing.
- **Every affected page is a placeholder.** `src/pages/{signin,account,checkout,cart}.tsx`, `src/pages/admin/index.tsx` (admin string catalogue, en/de) and `src/pages/supplier/index.tsx` (English literal) all render an `EmptyState`. `SiteHeader.tsx` already renders logo, search, Account, Cart and a static "Sign in" link to `/signin`, and search already routes to `/search?keywords=`.
- **No cart, customer record or purchase-order store exists.** `lib/catalog/cart.ts` only resolves item details for given ids in the cart locale. The e2e cases SWHR-C-0130, 0132, 0134 and 0135 nevertheless need an anonymous cart with items, a step-2 account-information form and a checkout page.
- **Later changes already on disk shape the seams.** shopping-cart (swhr-i-0008) design plans `cart_lines(session_id, item_id, quantity, added_at)` with a unique `(session_id, item_id)`, `GET /api/cart` and `POST /api/cart/items`, deleted on sign-out. customer-account (swhr-i-0007) owns `customers` (PK `user_id`), `profiles` and the full account form. supplier-inventory (swhr-i-0012) R3 forbids pre-filling staff credentials.
- **Password maximum (OQ-1) is not recoverable here.** `architecture/schema.sql` gives the legacy column as `varchar(255)`, which is not the application limit. Approved case SWHR-C-0113 reads the maximum "from config", so the value can stay configurable.
- **Test harness.** Vitest's `server` project includes `routes/**`, `lib/**` and `plugins/**` tests, not `middleware/**`. `tsconfig.node.json` already includes `middleware`. Playwright runs the dev server against the persistent `sqlite.db`, so an e2e that creates user "dave" collides on its second run.
- **CI.** `.github/workflows/ci.yml` runs doc links, typecheck, lint, unit, build and E2E on every push and pull request to `vortex/**`, `dev` and `main`. No change is needed.

### Planning decisions

- **P1. `users` becomes the credential table.** `users(userId text primary key, passwordHash text not null)`, as the mapping above says. The boilerplate `routes/api/users/**` routes and their tests are deleted: a list or lookup over credentials would leak them, and the create route is replaced by P7's. `profiles` is re-keyed to `userId text` referencing `users.userId`, and `preference.ts` takes a `string`. The demo rows and their seed go. The migration drops and recreates `users` and `profiles`, which only ever held demo data. `README.md`'s pointers to the deleted example routes are repointed to `routes/api/catalog/`.
- **P2. Passwords are hashed with `Bun.password`** (argon2id, Bun's default) and verified with `Bun.password.verify`. Verification is exact, so case matters. No code path logs a password (OQ-2). Seeds hash with `Bun.password.hashSync`, the same algorithm, so seeded users verify.
- **P3. Maximum lengths.** User id at most 25 characters, with no `%` or `*`. The password maximum is `SIGNON_PASSWORD_MAX_LENGTH`, read in one function, defaulting to **25** until OQ-1 is ruled on. The default is a provisional assumption, and the ruling is requested in SWHR-T-0049. Empty user id or password is rejected before any other check.
- **P4. One server-side session row per realm.** `sessions(id text primary key, realm text check in ('storefront','admin','supplier'), userId text null → users.userId, signedOn integer boolean, originalUrl text null, lastSeenAt timestamp_ms, createdAt timestamp_ms)`. The ids live in the existing sealed cookie as `authSessions: { storefront?, admin?, supplier? }`, next to the locale, so there is still one cookie. Ids are random UUIDs, not h3's session id. Each realm is independent (no single sign-on, as in the legacy system). On every lookup a row idle longer than `IDLE_TIMEOUT_MS[realm]` (storefront 15 min; admin and supplier 54 min) is deleted with its cart lines, and a fresh anonymous row replaces it. Otherwise `lastSeenAt` is touched. Locale stays in the cookie and is never part of a realm row, so sign-out keeps it without copying it.
- **P5. Protection config is a JSON file.** `configs/signon-config.json`, with its path overridable by `SIGNON_CONFIG_PATH`: `{ signOnPage, signOnErrorPage, protectedPages: [{ name, path, roles }] }`. The storefront entries are `/account`, `/account-edit` (the account-change action, owned by customer-account), `/checkout` (order information) and `/signon-welcome`. Paths are flat, not nested: in `vite-plugin-pages` an `account/` directory would turn `account.tsx` into a layout. A duplicate name keeps the first entry and logs a warning. Matching is exact on the pathname and ignores the query. Configured roles are parsed and ignored (OQ-3, `SWHR-R-0068`).
- **P6. The gate runs in three places, all through one function.** `checkGate(event, pathWithQuery)` records `originalUrl` and answers allowed or not.
  - The SPA calls it through `GET /api/signon/gate?path=` before rendering a protected route. `SignOnGate` in `main.tsx` fetches the protected list once (`GET /api/signon/config`) and only asks the server for listed paths, so a new protected page is a config change, not a code change.
  - `middleware/signon.ts` applies it to non-`/api` document requests.
  - `requireSignOn(event)` applies it to the API routes behind protected pages.
- **P7. Storefront API.**
  - `POST /api/signon { userId, password, remember }`: the remember cookie is written or cleared before authentication, as in the legacy system (OQ-4). The cookie is `signon_username`, 31 days, readable by the SPA. On success the route marks the session signed on, applies the preferred language and returns `{ redirect: originalUrl ?? "/" }` (OQ-5: home when there is no original URL). On failure it returns 401 `{ redirect: "/signin-error" }`.
  - `POST /api/users { userId, password }` creates the credential and marks the storefront session as pending registration (`userId` set, `signedOn` false). It returns 201 `{ redirect: "/register" }`, or 400/409 `{ redirect: "/user-creation-error", error }`.
  - `POST /api/customers { preferredLanguage }` completes step 2.
  - `POST /api/signoff` ends the storefront session and returns `{ redirect: "/signed-out" }`.
  - `GET /api/session` returns `{ signedOn, userId }`.
  - The repeated password is collected but not compared (OQ-7; not specified).
- **P8. Registration step 2 is a minimal seam.** `/register` shows the account-information form with only the preferred language (the supported locales, defaulting to the session locale). Submitting it creates `customers(userId text primary key → users.userId, createdAt)` and `profiles(userId, preferredLanguage)` in one transaction. It then marks the session signed on, applies the language, and returns the original URL, or `/` when that was `/account-edit` or absent. customer-account (swhr-i-0007) replaces the form and extends these tables; it must not recreate them.
- **P9. The cart seam, in shopping-cart's shape.** `cart_lines(sessionId → sessions.id, itemId → item.id, quantity, addedAt)` with a unique `(sessionId, itemId)`. `GET /api/cart` lists lines with item details (through `getCartItemDetails`), and `POST /api/cart/items { itemId }` adds one. The product page gets an Add to Cart control per item, and `/cart` lists lines and quantities. Ending a storefront session deletes its lines. Remove, update and subtotal remain shopping-cart's (swhr-i-0008).
- **P10. Staff access.**
  - **Roles and seeds.** Roles are stored in `role_assignments(realm, role, principalType 'user'|'group', principal)` and `group_members(groupName, userId)`. The seeds mirror `sun-j2ee-ri.xml`: in the admin realm, `administrator` goes to user `jps_admin` and group `administrator_group`; in the supplier realm, to user `supplier` and group `administrator_group`. Staff users sit in the same `users` table. Outside production only, `db/client.ts` seeds `jps_admin`, `supplier` and a group member `admin_member`. The staff forms are never pre-filled (supplier-inventory R3, OQ-8).
  - **API.** `POST /api/staff/signon { realm, userId, password }`, `POST /api/staff/signoff { realm }` and `GET /api/staff/session?realm=` (`{ signedOn, userId, isAdministrator }`). `requireRole(event, realm, "administrator")` returns 401 without a signed-on realm session and 403 without the role.
- **P11. Admin data service and launch (OQ-6, browser equivalent).**
  - `GET /api/admin/orders` needs a signed-on admin session, not the role (PRODUCT.md rule 11). It accepts the cookie or `Authorization: Session <id>`. Without one it returns 401 with `{ error: "Session Timed Out; Please exit and login as admin from the login page" }` and no data. With one it returns the supplier orders.
  - `GET /api/admin/launch` needs the role and returns `{ host, port, sessionId, ordersUrl }`. The Java Web Start client itself is out of scope.
- **P12. Staff screens.**
  - **Admin:** `/admin` is the public landing page with a Sign in link. `/admin/console` is role-gated. `/admin/signin` and `/admin/login-error` complete the set. Copy comes from the admin catalogue (en/de).
  - **Supplier:** `/supplier` is the inventory page. It sends a user who is not signed on to `/supplier/signin`, and shows a not-authorised message with no form to a user without the role. `/supplier/login-error` and `/supplier/signed-out` complete the set. Copy is English only, like the legacy supplier application.
  - **Shared component:** one sign-in form component serves both realms.
- **P13. The forms pattern is a design-system addition** (DESIGN.md §Forms). There is one shared input primitive in `src/components/ui/`. Every field has a visible label. On submit, a client-side empty check shows one message per empty field (for example "Password is empty.") in an alert region and does not submit. The server repeats every rule. The message pages (sign-in error, user-creation error, login error) use the shared `ErrorState` frame.
- **P14. Test placement.** Each implementing TASK writes the approved cases (`SWHR-C-*` in `test-cases.md`) for its own scenarios, with the id in the test name. SWHR-T-0048 writes all eight e2e cases, adds a coverage test and runs Playwright against a fresh database (`SQLITE_PATH`, read by `db/client.ts`). The coverage test must find `test-cases.md` both under `openspec/changes/<id>/` and under `openspec/changes/archive/*-<id>/`, because the directory moves at sprint close. SWHR-T-0044 adds `middleware/**/*.test.ts` to Vitest's `server` project.

### Spec discrepancies

These are recorded here and on the planning ticket. The delta spec is not edited.

- **SD-1. `users` and the session already exist in another shape** (findings above). P1 and P4 adapt them rather than add parallel tables.
- **SD-2. The cart, the account-information form and a purchase-order store belong to later capabilities** (swhr-i-0008, 0007, 0009). `SWHR-R-0070`, `SWHR-R-0072` and `SWHR-R-0073` are built on the P8 and P9 seams, in those changes' own planned shapes.
- **SD-3. There is no purchase-order data service to test `SWHR-R-0071.01` against.** The rule "the data layer applies no role check" is exercised on the supplier-order read functions (`getSupplierOrder`, `listSupplierOrders`), which the spec's requirement text also names. The purchase-order store (checkout, swhr-i-0009) must follow the same rule.
- **SD-4. The password maximum is unresolved (OQ-1).** It is configurable, with a provisional default of 25 (P3). The ruling is requested in SWHR-T-0049.
- **SD-5. The mockup pre-fills the demo credentials `j2ee`/`j2ee`**, but this design (OQ-8) and supplier-inventory R3 exclude that. The sign-in screen leaves both returning-customer fields empty when no user name is remembered. `SWHR-R-0053.02` checks only the checkbox and the new-account fields, so both readings pass it.
- **SD-6. The header's "Sign in" goes to `/signon-welcome`, not `/signin`.** `SWHR-R-0055` requires the link to lead to the protected welcome page, so sign-in is started by the gate and ends on the welcome page. The current header links straight to the sign-in screen. The mockups' cart count badge is a shopping-cart matter and is not built here.
- **SD-7. Storefront and staff principals share one credential table,** where the legacy system used separate stores. Roles are never read on the storefront (`SWHR-R-0068`), so a staff user signing in there gains nothing.
- **SD-8. The staff seeds are development data.** Production has no seeded staff user, so provisioning is an operator step (SWHR-T-0049).

### Phases

| Phase                                   | Ticket      | Group | Depends on               |
| --------------------------------------- | ----------- | ----- | ------------------------ |
| 1. Data model                           | SWHR-T-0042 | 1     | —                        |
| 2. Credential rules                     | SWHR-T-0043 | 2     | SWHR-T-0042              |
| 3. Sessions and the gate (parallel w/2) | SWHR-T-0044 | 3     | SWHR-T-0042              |
| 4. Storefront API                       | SWHR-T-0045 | 4     | SWHR-T-0043, SWHR-T-0044 |
| 5. Storefront screens                   | SWHR-T-0046 | 5     | SWHR-T-0045              |
| 6. Staff access                         | SWHR-T-0047 | 6     | SWHR-T-0046              |
| 7. Test suite                           | SWHR-T-0048 | 7     | SWHR-T-0047              |

- **Test-harness phase.** Server and route tests go in the Vitest `server` project, UI tests in `client`. SWHR-T-0044 adds `middleware/**` to `server`. SWHR-T-0048 gives Playwright a fresh database per run through `SQLITE_PATH`, which SWHR-T-0042 teaches `db/client.ts` to read.
- **CI phase.** The existing workflow already runs every tier on `vortex/**`, so no workflow change is needed. The eight e2e cases run in its E2E step.
- **Sequencing.** Groups 5 and 6 are chained, not parallel, because both render forms through the input primitive that 5 creates.

### Interface contracts

These are fixed at planning. Later tickets code against them. A ticket may add exports but must not change these.

```ts
// lib/auth/credentials.ts (SWHR-T-0043)
export const USER_ID_MAX_LENGTH = 25;
export function getPasswordMaxLength(): number; // SIGNON_PASSWORD_MAX_LENGTH, default 25
export type CredentialError =
  | "missing"
  | "user-id-too-long"
  | "user-id-wildcard"
  | "password-too-long"
  | "duplicate";
export function validateUserId(userId: string): CredentialError | null;
export function validatePassword(password: string): CredentialError | null;
export async function createCredential(
  userId: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: CredentialError }>;
export async function authenticate(userId: string, password: string): Promise<boolean>; // unknown user → false, never throws

// lib/auth/session.ts (SWHR-T-0044)
export type Realm = "storefront" | "admin" | "supplier";
export const IDLE_TIMEOUT_MS: Record<Realm, number>; // 15 min, 54 min, 54 min
export interface AuthSession {
  id: string;
  realm: Realm;
  userId: string | null;
  signedOn: boolean;
  originalUrl: string | null;
}
export async function getAuthSession(event: H3Event, realm: Realm): Promise<AuthSession>; // expires idle rows, touches lastSeenAt
export async function findAuthSessionById(id: string, realm: Realm): Promise<AuthSession | null>; // null when missing or idle-expired
export async function updateAuthSession(
  event: H3Event,
  realm: Realm,
  patch: Partial<Pick<AuthSession, "userId" | "signedOn" | "originalUrl">>,
): Promise<AuthSession>;
export async function endAuthSession(event: H3Event, realm: Realm): Promise<void>; // deletes the row and its cart lines

// lib/auth/protection.ts (SWHR-T-0044)
export interface ProtectedPage {
  name: string;
  path: string;
  roles: string[];
}
export interface ProtectionConfig {
  signOnPage: string;
  signOnErrorPage: string;
  protectedPages: ProtectedPage[];
}
export const ACCOUNT_CHANGE_PATH = "/account-edit";
export function loadProtectionConfig(
  raw: unknown,
  warn?: (message: string) => void,
): ProtectionConfig; // first duplicate name wins
export function getProtectionConfig(): ProtectionConfig; // configs/signon-config.json or SIGNON_CONFIG_PATH
export function isProtectedPath(config: ProtectionConfig, pathWithQuery: string): boolean; // exact pathname match
export async function checkGate(
  event: H3Event,
  pathWithQuery: string,
  config?: ProtectionConfig,
): Promise<{ allowed: true } | { allowed: false; redirect: string }>;
export async function requireSignOn(event: H3Event): Promise<AuthSession>; // 401 when not signed on

// lib/cart/lines.ts (SWHR-T-0044)
export function addCartItem(sessionId: string, itemId: string): void; // +1, one line per item
export function listCartLines(sessionId: string): { itemId: string; quantity: number }[];

// lib/auth/roles.ts (SWHR-T-0047)
export type StaffRealm = "admin" | "supplier";
export function hasRole(userId: string, realm: StaffRealm, role: "administrator"): boolean; // direct or through a group
export async function requireRole(
  event: H3Event,
  realm: StaffRealm,
  role: "administrator",
): Promise<AuthSession>; // 401 / 403

// lib/b2b/exchange/supplierOrders.ts (SWHR-T-0042) — no role or session check (SWHR-R-0071)
export function getSupplierOrder(orderId: string): SupplierOrderRecord | null;
export function listSupplierOrders(): SupplierOrderRecord[];

// src/hooks/useSignOnSession.ts (SWHR-T-0046)
export function useSignOnSession(): {
  signedOn: boolean;
  userId: string | null;
  refresh: () => Promise<void>;
};
```

HTTP surface (JSON bodies; every redirect is a path the SPA navigates to):

| Route                                                                | Ticket      | Result                                                                                      |
| -------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `GET /api/session`                                                   | SWHR-T-0044 | `{ signedOn, userId }`                                                                      |
| `GET /api/signon/config`                                             | SWHR-T-0044 | `{ signOnPage, protectedPaths: string[] }`                                                  |
| `GET /api/signon/gate?path=`                                         | SWHR-T-0044 | `{ allowed: true }` or `{ allowed: false, redirect }`; records `originalUrl`                |
| `GET /api/cart`, `POST /api/cart/items { itemId }`                   | SWHR-T-0044 | lines with item details; never gated                                                        |
| `POST /api/signon { userId, password, remember }`                    | SWHR-T-0045 | 200 `{ redirect }` or 401 `{ redirect: "/signin-error" }`                                   |
| `POST /api/users { userId, password }`                               | SWHR-T-0045 | 201 `{ redirect: "/register" }` or 400/409 `{ redirect: "/user-creation-error", error }`    |
| `POST /api/customers { preferredLanguage }`                          | SWHR-T-0045 | 200 `{ redirect }`; 401 without a pending registration                                      |
| `POST /api/signoff`                                                  | SWHR-T-0045 | 200 `{ redirect: "/signed-out" }`                                                           |
| `POST /api/staff/signon { realm, userId, password }`                 | SWHR-T-0047 | 200 `{ redirect }` or 401 `{ redirect: "/<realm>/login-error" }`                            |
| `POST /api/staff/signoff { realm }`, `GET /api/staff/session?realm=` | SWHR-T-0047 | `{ redirect: "/admin" \| "/supplier/signed-out" }`; `{ signedOn, userId, isAdministrator }` |
| `GET /api/admin/orders`, `GET /api/admin/launch`                     | SWHR-T-0047 | P11                                                                                         |
