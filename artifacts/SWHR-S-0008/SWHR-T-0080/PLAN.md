# SWHR-T-0080 — Customer account data model

Change `swhr-i-0007-customer-account-and-profile`, tasks.md group 1. Read `openspec/changes/swhr-i-0007-customer-account-and-profile/design.md` §Sprint planning first (P1, P2, P3, SD1–SD3). Depends on SWHR-T-0085.

## Objective

`db/schema.ts` holds the whole customer model: the existing `customers` and extended `profiles`, plus `accounts`, `contactInfos`, `addresses` and `creditCards`, with one-to-one ownership and real cascading deletes. The migration is committed.

## Design reference

No UI.

## Steps

1. Extend `profiles` (P1): add `favoriteCategory`, `myListPreference`, `bannerPreference`; move the `userId` FK to `customers.userId` with `onDelete: "cascade"`. Keep `customers` unchanged.
2. Add `accounts`, `contactInfos`, `addresses`, `creditCards` (P2): integer autoincrement ids, child-side unique owner FKs with `onDelete: "cascade"`, the status CHECK. Column names mirror `supplierContacts`/`supplierAddresses` (camelCase). The card stores `cardLastFour`, never a full number (P3).
3. Generate the migration with the project's drizzle generate script; commit `drizzle/0006_*.sql` and `drizzle/meta/*`. Check that SQLite's table rebuild for `profiles` keeps existing sign-on rows (FKs are on during migrate).
4. `lib/account/schema.test.ts` (new): prove AC-1 … AC-7 with direct drizzle inserts and deletes on the in-memory db. Name each test after its approved `SWHR-C-*` case id from the change's `test-cases.md` where one exists.
5. Confirm `routes/api/customers.test.ts`, `lib/locale/preference.test.ts` and the sign-on tests still pass unchanged. The new profile columns have defaults, so the existing insert keeps working.

## File/module ownership

- `db/schema.ts`
- `drizzle/0006_*.sql`, `drizzle/meta/*` — generated
- `db/client.ts` — only if the drizzle `schema` map must list the new tables
- `lib/account/schema.test.ts` — new

## Interface contracts (fixed — SWHR-T-0081 codes against these)

```ts
profiles:     userId text PK → customers.userId (cascade); preferredLanguage text notNull default "en_US";
              favoriteCategory text null; myListPreference / bannerPreference integer({mode:"boolean"}) notNull default true
accounts:     id int PK autoinc; userId text notNull unique → customers.userId (cascade);
              status text notNull default "active" CHECK IN ('active','disabled')
contactInfos: id int PK autoinc; accountId int null unique → accounts.id (cascade);
              givenName, familyName, telephone, email text notNull default ""
addresses:    id int PK autoinc; contactInfoId int null unique → contactInfos.id (cascade);
              streetName1, city, state, zipCode, country text notNull default ""; streetName2 text null
creditCards:  id int PK autoinc; accountId int null unique → accounts.id (cascade);
              cardLastFour, cardType text notNull default ""; expiryDate text null
```

Exported table objects: `profiles`, `customers` (existing), `accounts`, `contactInfos`, `addresses`, `creditCards`.

## Definition of Done

AC-1 … AC-7 on the ticket, each proven by a named test.
