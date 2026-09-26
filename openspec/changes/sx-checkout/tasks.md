## 1. Data model

- [ ] 1.1 Add the identifier counter schema (unique name up to 255 chars, non-null integer value) in `db/` and generate its migration
- [ ] 1.2 Add the order outbox schema (order id, XML payload, created-at, delivery state) in `db/` and generate its migration
- [ ] 1.3 Ensure the stored purchase order holds its own contact, address and card snapshot rather than a reference to the profile contact
- [ ] 1.4 Store the purchase order total verbatim as supplied, with no recomputation on persist

## 2. Identifier generation

- [ ] 2.1 Implement get-or-create of a per-prefix counter starting at 0, failing with an error that names the prefix when creation fails
- [ ] 2.2 Implement increment-and-format (prefix followed by the decimal value, no padding) in a single transaction joining the caller's transaction
- [ ] 2.3 Add unit tests for first id "10011", counter-at-7 giving "10018", a new prefix, and a concurrent-issuance uniqueness check

## 3. Order placement service

- [ ] 3.1 Validate billing and shipping contacts (required fields trimmed, address line 2 and e-mail optional, blank line 2 stored as absent)
- [ ] 3.2 Reject an empty cart with a dedicated empty-cart error before any order is built
- [ ] 3.3 Build the purchase order (order id, user id, billing e-mail, order date, both contacts, credit card, locale)
- [ ] 3.4 Build order lines in cart order with line numbers from 0, and compute the total as sum of unit cost times quantity
- [ ] 3.5 Attach a credit card to the order, pending the OQ-1 decision on its source
- [ ] 3.6 Serialize the purchase order to its XML document and write it to the outbox in the same transaction
- [ ] 3.7 Empty the cart after the hand-off, and roll back everything (id, outbox row, cart) on any failure
- [ ] 3.8 Expose order placement as a Nitro POST route returning order id and billing e-mail
- [ ] 3.9 Add integration tests for success, empty cart, missing field, and send-failure rollback

## 4. Asynchronous hand-off

- [ ] 4.1 Implement the outbox consumer that delivers each committed order document to order processing exactly once
- [ ] 4.2 Ensure an uncommitted or rolled-back order never reaches the consumer
- [ ] 4.3 Release messaging resources and surface delivery errors rather than dropping messages

## 5. Screens

- [ ] 5.1 Build the order information page with Billing and Shipping sections pre-filled from the stored contact and a Submit control
- [ ] 5.2 Gate the order information page behind sign-in
- [ ] 5.3 Show per-field missing-value errors on the form when submission is rejected
- [ ] 5.4 Build the order complete page showing the heading, order id and confirmation e-mail address
- [ ] 5.5 Show the empty-cart Order Error with the re-submission note
- [ ] 5.6 Add UI tests for both pages and the empty-cart error, and an E2E spec for cart to checkout to confirmation

## 6. Error routing

- [ ] 6.1 Map failure kinds to error displays (empty cart, duplicate account, general), with subtypes covered by their parent kind
- [ ] 6.2 Return a generic server error naming the failure kind for unmapped failures

## 7. Open questions

- [ ] 7.1 Resolve OQ-1 (credit card source) and OQ-5 (persisting billing contact separately) with product
- [ ] 7.2 Resolve OQ-3 (money representation and rounding) and record it in ARCHITECTURE.md Key Decisions
