## Why

The legacy Java Pet Store 1.3.2 emails customers as their orders are approved or denied, shipped in parts, and completed. These rules sit across the order-processing centre's mail producers, a shared mailer component, a configuration locator and the deployment guide, and none of them is written down in one place. The rebuild has to reproduce them, so they are extracted here as a spec that can be verified.

## What Changes

- Adds the `customer-notifications` capability, which covers three order-status emails (approval decision, shipment, order completed), each with its own deployment switch.
- Specifies asynchronous delivery. Order processing hands off a mail request (recipient, subject, HTML body) and never sends mail inline.
- Specifies how a mail request is validated, how outgoing email is formatted, the sender and mail-server configuration, and what happens when a send fails. In the legacy system a failed send is logged and discarded.
- Specifies localized email content (en_US, ja_JP, zh_CN) and the visible content of the approval-decision and shipment emails.

## Capabilities

### New Capabilities

- `customer-notifications`: order-status emails to customers, covering the triggers, switches, content, delivery and failure handling.

### Modified Capabilities

- none

## Impact

- Server: a mail-request queue (outbox) and a sender worker under Nitro, with notification producers hooked into order approval, invoice receipt and order completion.
- Data: a new Drizzle table for queued mail requests in `db/`, with its migration in `drizzle/`.
- Configuration: three notification switches, the sender address and the SMTP server settings.
- Depends on the order-processing capabilities that own order status, invoices and the order's email address and locale.
