# Proposal: sign-on

## Why

In the Java Pet Store 1.3.2 storefront, a shopper must sign on before seeing their account or checking out, while catalog, search and cart stay anonymous. The administration console and the supplier application use a separate, role-based sign-in. The rebuild has to reproduce the credential rules, the protected-page gate, return-to-original-page, the remember-user-name cookie, sign-out that keeps the language, and the session lifetimes. Most of these rules are undocumented and sit in a servlet filter, deployment descriptors and entity-bean `ejbCreate` checks. This change captures them from the extracted IR.

## What Changes

- Add the `sign-on` capability, with requirements for:
  - the three user-facing surfaces: the sign-in screen, the sign-in error screen and the storefront page header (3 screen requirements)
  - the credential record and its creation rules: unique user id, 25-character limit, no `%` or `*`, and a password maximum length
  - authentication, sign-on submission, return to the originally requested page, and the remember-user-name cookie
  - the protected-page gate: which storefront pages need sign-on, exact path matching, and configurable protection
  - two-step registration: create credential, then customer profile, then signed on
  - sign-out, including session reset while the language is kept
  - session idle timeouts for the storefront, administration and supplier applications
  - administrator-only access to the administration console and supplier inventory, sign-in failure, sign-out, and the session-bound admin client launch
  - anonymous access to catalog, cart and credential services
- Flag eight open or disputed points for a human decision (see `design.md`, OQ-1 to OQ-8). The most significant are the redacted password maximum, plaintext password storage, unenforced roles on storefront protected pages, and the undefined landing page after a direct sign-on.

## Impact

- New spec: `specs/sign-on/spec.md`.
- New data: a `users` credential table in a `db/` Drizzle schema, with its migration generated into `drizzle/`, plus a server-side session store (see design.md).
- New Nitro routes for sign-on, account creation and sign-out, and a server middleware for the protected-page gate.
- New SPA pages for sign-in, sign-in error, user-creation error and signed-out, plus a shared header component.
- Depends on:
  - `customer-account`, which owns the customer profile form that completes registration
  - `localization`, for the session language kept across sign-out
  - `checkout`, which relies on the gate for the order-information page
