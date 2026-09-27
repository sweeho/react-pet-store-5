# Proposal: checkout

## Why

The Java Pet Store 1.3.2 storefront lets a signed-in customer turn a cart into an order. The customer confirms billing and shipping details and receives an order id immediately, and the order is handed to order processing asynchronously. The rebuild must reproduce this behaviour. It includes several rules that no document states: the `1001`-prefixed order id sequence, the empty-cart rejection, snapshot storage of the order contact, and the transactional hand-off. This change captures them from the extracted IR.

## What Changes

- Add the `checkout` capability, with requirements for:
  - the order information form and the order complete screen (2 screen requirements)
  - the required-field rules for billing and shipping contacts
  - empty-cart rejection
  - purchase order contents, lines and total
  - the credit card attachment
  - asynchronous, transactional hand-off to order processing
  - order identifier generation
  - persistence of the order contact, address, card and total
  - error-screen routing
- Flag seven disputed or low-confidence points for human decision (see `design.md`, OQ-1 to OQ-7). The most significant are the hard-coded credit card, the partly swallowed hand-off failure, and the broken missing-field path.

## Impact

- New spec: `specs/checkout/spec.md`.
- New data: a per-prefix identifier counter table and an order outbox. Both are Drizzle schemas under `db/`, with migrations generated into `drizzle/`.
- New server route for order placement, and two SPA pages.
- Depends on:
  - `customer-account`, for sign-in and the stored contact used to pre-fill the form
  - the shopping cart
  - `b2b-document-exchange`, for the purchase-order XML format consumed by order processing
