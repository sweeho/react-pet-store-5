## 1. Data model

- [x] 1.1 Define the customers table keyed by unique user id in db/schema.ts (SWHR-T-0080)
- [x] 1.2 Define the accounts table with status ("active" / "disabled") and one-to-one links to contact information and credit card (SWHR-T-0080)
- [x] 1.3 Define the contact_infos table (given name, family name, telephone, email) with a one-to-one owned postal address (SWHR-T-0080)
- [x] 1.4 Define the addresses table with six text fields and a system-generated key (SWHR-T-0080)
- [x] 1.5 Define the credit_cards table (number, type, expiry) with a system-generated key, not keyed by card number (SWHR-T-0080)
- [x] 1.6 Define the profiles table with preferred language, nullable favourite category and non-null My List and banner flags (SWHR-T-0080)
- [x] 1.7 Configure cascading deletion customer→account/profile, account→contact/card, contact→address (SWHR-T-0080)
- [x] 1.8 Generate and commit the drizzle migration (SWHR-T-0080)

## 2. Account domain services

- [ ] 2.1 Implement atomic customer creation (customer, active account, empty contact, empty address, empty card, default profile) in one transaction (SWHR-T-0081)
- [ ] 2.2 Implement profile defaults (en_US, no favourite category, My List on, banner on) (SWHR-T-0081)
- [ ] 2.3 Implement account creation with supplied status, contact information and card (SWHR-T-0081)
- [ ] 2.4 Implement the three contact-information creation paths (empty, from complete value with address copy, from fields plus existing address) (SWHR-T-0081)
- [ ] 2.5 Implement field-level read/update and detached whole-value read for contact, card, profile and status (SWHR-T-0081)
- [ ] 2.6 Implement customer lookup by user id and list-all (SWHR-T-0081)
- [ ] 2.7 Implement card expiry composition (MM/YYYY) and month/year derivation with the 01/2010 fallback (SWHR-T-0081)
- [ ] 2.8 Implement customer deletion relying on the cascade (SWHR-T-0081)

## 3. Server routes and validation

- [ ] 3.1 Add the route returning the signed-on customer's account (SWHR-T-0082)
- [ ] 3.2 Add the registration route creating the account once for the signed-on user (SWHR-T-0082)
- [ ] 3.3 Add the update route replacing contact, address, card and profile with submitted values (SWHR-T-0082)
- [ ] 3.4 Enforce that a signed-on user reads and updates only their own account in the route layer (SWHR-T-0082)
- [ ] 3.5 Validate required contact fields after trimming; store blank street line 2 as absent; keep email optional (SWHR-T-0082)
- [ ] 3.6 Validate required preferred language and favourite category; default unticked My List and banner to off (SWHR-T-0082)

## 4. Account screens

- [ ] 4.1 Build the account information page with contact, card, expiry, language, category and Yes/No preferences (SWHR-T-0083)
- [ ] 4.2 Add the edit control on the account page opening the edit form (SWHR-T-0083)
- [ ] 4.3 Build the account creation form with the fixed choice lists and English/Birds defaults (SWHR-T-0083)
- [ ] 4.4 Build the account edit form preselecting stored values (SWHR-T-0083)
- [ ] 4.5 Block submission and show "<field name> is empty." for empty validated fields (SWHR-T-0083)

## 5. Personalisation

- [ ] 5.1 Build the My List panel listing up to 10 favourite-category products with product links, shown only when My List is on (SWHR-T-0084)
- [ ] 5.2 Build the pet-tips banner chosen case-insensitively by favourite category with the dogs fallback, on home and cart only when banner is on (SWHR-T-0084)

## 6. Open questions

- [x] 6.1 Obtain a decision on card number storage, masking and access (design Q1) before building 1.5 and 4.1 (SWHR-T-0085)
- [x] 6.2 Obtain the authoritative card type, expiry year range, expiry format and country lists (design Q2, Q5, Q7) (SWHR-T-0085)
- [x] 6.3 Obtain decisions on disabled accounts, customer deletion and field formats (design Q8, Q9, Q10) (SWHR-T-0085)

## 7. Tests

- [ ] 7.1 Unit-test expiry composition, derivation and fallback (SWHR-T-0086)
- [ ] 7.2 Integration-test atomic creation, defaults and cascading deletion against the in-memory database (SWHR-T-0086)
- [ ] 7.3 Integration-test registration, update and required-field validation routes (SWHR-T-0086)
- [ ] 7.4 UI-test the account page, create/edit forms and empty-field check (SWHR-T-0086)
- [ ] 7.5 UI-test the My List panel and banner visibility and selection (SWHR-T-0086)
