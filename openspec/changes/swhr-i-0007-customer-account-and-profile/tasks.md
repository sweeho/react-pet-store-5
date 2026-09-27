## 1. Data model

- [ ] 1.1 Define the customers table keyed by unique user id in db/schema.ts
- [ ] 1.2 Define the accounts table with status ("active" / "disabled") and one-to-one links to contact information and credit card
- [ ] 1.3 Define the contact_infos table (given name, family name, telephone, email) with a one-to-one owned postal address
- [ ] 1.4 Define the addresses table with six text fields and a system-generated key
- [ ] 1.5 Define the credit_cards table (number, type, expiry) with a system-generated key, not keyed by card number
- [ ] 1.6 Define the profiles table with preferred language, nullable favourite category and non-null My List and banner flags
- [ ] 1.7 Configure cascading deletion customer→account/profile, account→contact/card, contact→address
- [ ] 1.8 Generate and commit the drizzle migration

## 2. Account domain services

- [ ] 2.1 Implement atomic customer creation (customer, active account, empty contact, empty address, empty card, default profile) in one transaction
- [ ] 2.2 Implement profile defaults (en_US, no favourite category, My List on, banner on)
- [ ] 2.3 Implement account creation with supplied status, contact information and card
- [ ] 2.4 Implement the three contact-information creation paths (empty, from complete value with address copy, from fields plus existing address)
- [ ] 2.5 Implement field-level read/update and detached whole-value read for contact, card, profile and status
- [ ] 2.6 Implement customer lookup by user id and list-all
- [ ] 2.7 Implement card expiry composition (MM/YYYY) and month/year derivation with the 01/2010 fallback
- [ ] 2.8 Implement customer deletion relying on the cascade

## 3. Server routes and validation

- [ ] 3.1 Add the route returning the signed-on customer's account
- [ ] 3.2 Add the registration route creating the account once for the signed-on user
- [ ] 3.3 Add the update route replacing contact, address, card and profile with submitted values
- [ ] 3.4 Enforce that a signed-on user reads and updates only their own account in the route layer
- [ ] 3.5 Validate required contact fields after trimming; store blank street line 2 as absent; keep email optional
- [ ] 3.6 Validate required preferred language and favourite category; default unticked My List and banner to off

## 4. Account screens

- [ ] 4.1 Build the account information page with contact, card, expiry, language, category and Yes/No preferences
- [ ] 4.2 Add the edit control on the account page opening the edit form
- [ ] 4.3 Build the account creation form with the fixed choice lists and English/Birds defaults
- [ ] 4.4 Build the account edit form preselecting stored values
- [ ] 4.5 Block submission and show "<field name> is empty." for empty validated fields

## 5. Personalisation

- [ ] 5.1 Build the My List panel listing up to 10 favourite-category products with product links, shown only when My List is on
- [ ] 5.2 Build the pet-tips banner chosen case-insensitively by favourite category with the dogs fallback, on home and cart only when banner is on

## 6. Open questions

- [ ] 6.1 Obtain a decision on card number storage, masking and access (design Q1) before building 1.5 and 4.1
- [ ] 6.2 Obtain the authoritative card type, expiry year range, expiry format and country lists (design Q2, Q5, Q7)
- [ ] 6.3 Obtain decisions on disabled accounts, customer deletion and field formats (design Q8, Q9, Q10)

## 7. Tests

- [ ] 7.1 Unit-test expiry composition, derivation and fallback
- [ ] 7.2 Integration-test atomic creation, defaults and cascading deletion against the in-memory database
- [ ] 7.3 Integration-test registration, update and required-field validation routes
- [ ] 7.4 UI-test the account page, create/edit forms and empty-field check
- [ ] 7.5 UI-test the My List panel and banner visibility and selection
