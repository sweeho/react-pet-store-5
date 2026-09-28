# PLAN — SWHR-T-0015 · Orders and e-mails

Change `swhr-i-0003-localization` · tasks.md group 6 · Requirements: _Purchase order locale_, _Localized customer emails_, _Email price formats_. Read `openspec/changes/swhr-i-0003-localization/design.md` first (D5, P6, P7, Q2, Q3, SD-6, SD-9).

## Objective

The order-locale default and a locale-selected customer e-mail renderer with the spec's price patterns, ready for checkout and notifications to call.

## Steps

1. `lib/orders/locale.ts` `normaliseOrderLocale(input)`: absent/empty → `en_US`; otherwise the given identifier (P6).
2. `lib/email/templates/`: render functions for `approval`, `shipment`, `completed` × {base, `en_US`, `ja_JP`, `zh_CN`} (P7).
3. `lib/email/render.ts` `renderCustomerEmail(kind, order)`: `parseLocale(order.locale)` null → base template; parsed locale with no template → throw `EmailTemplateNotFoundError` ("No template found for locale <id>") and produce nothing (D5, Q3).
4. `lib/email/price.ts` `formatEmailPrice(amount, templateLocale)`: `$#,##0.00` for base/en_US/zh_CN, `￥#,##0` for ja_JP (tasks 6.4).
5. Unit tests for every AC, including a de_DE order failing.

## Fixed interface contract

```ts
export function normaliseOrderLocale(input?: string | null): LocaleId;
export type CustomerEmailKind = "approval" | "shipment" | "completed";
export interface EmailOrder {
  orderId: string;
  locale: string;
  lines: { itemId: string; name: string; quantity: number; unitPrice: number }[];
  [k: string]: unknown;
}
export interface RenderedEmail {
  templateId: string;
  subject: string;
  body: string;
}
export function renderCustomerEmail(kind: CustomerEmailKind, order: EmailOrder): RenderedEmail; // throws EmailTemplateNotFoundError
export function formatEmailPrice(amount: number, templateLocale: LocaleId | "default"): string;
```

## File/module ownership

- `lib/orders/locale.ts`, `lib/email/**` and their tests (all new)

## Definition of Done

AC-1 … AC-6 pass as unit tests; `renderCustomerEmail` returns `templateId` so selection is assertable.

## Design reference

No screen in this task. Sprint designs: `artifacts/SWHR-S-0002/design/MANIFEST.md`.
