# PLAN — SWHR-T-0159: Email templates (task group 3)

Change: `swhr-i-0013-customer-notifications`. Read its `design.md` §"Sprint planning — SWHR-S-0016" first (P4, SD-3, SD-4, SD-8, SD-9, SD-12). Requirements: **Approval decision email content**, **Shipment email content**, the content half of **Order completed notification**, and the rendering side of **Notifications rendered in the order's locale**. Localization's **Localized customer emails** (SWHR-R-0018) and **Email price formats** (SWHR-R-0019) in `openspec/specs/localization/` must keep holding.

## Design reference

- `artifacts/SWHR-S-0016/design/mockup-approval-decision-email-approved.html`
- `artifacts/SWHR-S-0016/design/mockup-approval-decision-email-denied.html`
- `artifacts/SWHR-S-0016/design/mockup-shipment-email.html`
- `artifacts/SWHR-S-0016/design/mockup-order-completed-email.html`
- Wireframes of the same names under `wireframe-*`. Index: `artifacts/SWHR-S-0016/design/MANIFEST.md`.

Build the message part of each mockup: from the "Pet Store" heading down to the customer-service footer. The mail-client frame (subject, From, To, Date) is not body. E-mail clients strip `<style>` and classes, so carry the mockups' colours, spacing and table rules as inline styles.

## Objective

Render the three customer e-mails as HTML in en_US, ja_JP and zh_CN, with the spec's subjects and wording.

## Steps

1. Change `lib/email/types.ts` to the P4 shapes. Update the fixtures in `lib/email/render.test.ts` to the new line fields, keeping every assertion's meaning (template ids, default fallback, `de_DE` error, `$1,234.50`, `￥2,000`).
2. Write the template tests first, in `lib/email/templates/*.test.ts` or `render.test.ts`:
   - SWHR-C-0428: the approved e-mail for 1001 thanks the customer, shows 1001, and states "approved! We will now fulfill your order."
   - SWHR-C-0429: the denied e-mail for 1002 states "denied unfortunately. Sorry we could not place your order."
   - SWHR-C-0430: the shipment table has the four headers and the rows `FISH | FI-SW-01 | 2 | $16.50` and `DOGS | K9-BD-01 | 1 | $18.50`. Parse the HTML with the DOM in the test rather than matching strings.
   - The completed e-mail lists every line and says the entire order has shipped.
   - Subjects for each kind.
   - ja_JP and zh_CN bodies contain their own wording.
   - A `<b>` category is escaped.
3. Rewrite `templates/approval.ts`, `shipment.ts` and `completed.ts`. Share the HTML frame, the table and an escape helper in one new `lib/email/html.ts`. The en_US text is the mockups' verbatim. Write ja_JP and zh_CN translations of the same sentences, and list them in your summary for human sign-off (SD-4).
4. Leave `formatEmailPrice` and `renderCustomerEmail`'s selection logic unchanged.

## File/module ownership

- modify `lib/email/types.ts`, `lib/email/render.ts` (only if types force it), `lib/email/render.test.ts`
- modify `lib/email/templates/approval.ts`, `shipment.ts`, `completed.ts`; new tests beside them
- new `lib/email/html.ts` (+ test)

## Definition of Done

AC-1 to AC-7 of the ticket.
