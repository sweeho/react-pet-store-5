# SWHR-T-0081 summary

Added `lib/account/` domain services: `types.ts`, `expiry.ts` (MM/YYYY compose, 01/2010 fallback), `contactInfo.ts` (three creation paths, detached `getContactInfo`, `updateContactField`), `customer.ts` (atomic `createCustomer` with optional caller tx, seeded `createAccount`, `getCustomerAccount`, `listCustomers`, `replaceCustomerAccount`, `deleteCustomer` via cascade). No role or session checks. Tests beside each module.

AC coverage: all 17 approved cases (see tdd-test-result.md). Verification: `bun run verify` exit 0 (660 tests).

Deviations from PLAN.md (minor): the contact-info creators take an optional `accountId` (after `tx`) so `createCustomer`/`createAccount` attach records atomically; `createAddress` and `ContactParts`/`ContactField` are additional exports; `Executor` type added to `types.ts`. Contract signatures otherwise unchanged.
