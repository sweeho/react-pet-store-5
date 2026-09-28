---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0015
branch: vortex/feat/SWHR-T-0015-orders-and-e-mails-order-locale-default-206bd792
upstream: [artifacts/SWHR-S-0002/SWHR-T-0015/PLAN.md]
downstream: [artifacts/SWHR-S-0002/qa-test-report.md]
---

# Summary — SWHR-T-0015: Orders and e-mails — order locale default, per-locale e-mail templates and price formats

## What changed

Added the order-locale default (`normaliseOrderLocale`) and a customer e-mail renderer
(`renderCustomerEmail`) that selects the approval/shipment/completed template by order locale
(base template for an unparseable locale, `EmailTemplateNotFoundError` for a parsed locale with
no template), plus per-template price formatting (`formatEmailPrice`).

## Files

- `lib/orders/locale.ts` — `normaliseOrderLocale(input)`: `en_US` default via `getDefaultLocale()`, otherwise passthrough.
- `lib/email/types.ts` — shared `CustomerEmailKind`, `EmailOrder`, `RenderedEmail`, `EmailTemplateVariant` types.
- `lib/email/price.ts` — `formatEmailPrice(amount, templateLocale)`: dollar pattern for default/en_US/zh_CN, yen pattern for ja_JP.
- `lib/email/templates/{approval,shipment,completed}.ts` — one render function per kind, keyed `<kind>_<variant>` for `default`/`en_US`/`ja_JP`/`zh_CN`.
- `lib/email/render.ts` — `renderCustomerEmail(kind, order)` selection logic and `EmailTemplateNotFoundError`.
- `lib/orders/locale.test.ts`, `lib/email/price.test.ts`, `lib/email/render.test.ts` — new unit tests (all new files, per PLAN.md ownership).

## AC coverage

- AC-1 (order submitted without a locale → `en_US`): `lib/orders/locale.ts:normaliseOrderLocale`, covered by `locale.test.ts › [AC-1]`.
- AC-2 (Japanese order → Japanese shipment template): `lib/email/render.ts:renderCustomerEmail`, covered by `render.test.ts › [AC-2]`.
- AC-3 (unresolvable locale → default template): same function, covered by `render.test.ts › [AC-3]`.
- AC-4 (locale with no template → fails, no email produced): `EmailTemplateNotFoundError` in `render.ts`, covered by `render.test.ts › [AC-4]`.
- AC-5 (English unit price → `$1,234.50`): `lib/email/price.ts:formatEmailPrice`, covered by `price.test.ts › [AC-5]` and `render.test.ts › [AC-5]`.
- AC-6 (Japanese unit price → `￥2,000`): same function, covered by `price.test.ts › [AC-6]` and `render.test.ts › [AC-6]`.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  18 passed (18)
     Tests  56 passed (56)
```

See `tdd-test-result.md` — `TDD-RESULT: 56 passed, 0 failed`.

`bun run verify:full`'s E2E tier could not run: `scripts/ensure-playwright-browser.mjs` reports Chromium
is not installed in this container. Not retried, per workflow instructions (E2E runs at
INTEGRATION_QA / CI). This ticket has no UI surface — PLAN.md's Design reference says "No screen in
this task" — so the E2E gate does not apply here regardless.

## Notes

`normaliseOrderLocale` uses `getDefaultLocale()` (from `lib/locale/model.ts`, SWHR-T-0013) rather than
a literal `"en_US"` string, so the order-locale default and the session-locale default share the same
single, deployment-configurable default path (design D2/P1). Behaviour is identical to a literal
default under the current deployment configuration (`DEFAULT_LOCALE` unset).
