---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0015
branch: vortex/feat/SWHR-T-0015-orders-and-e-mails-order-locale-default-206bd792
upstream: [artifacts/SWHR-S-0002/SWHR-T-0015/PLAN.md]
---

# TDD result — SWHR-T-0015

## Test cases

| Test                                                                                                                                    | Covers                  | Intent                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/orders/locale.test.ts › normaliseOrderLocale › [AC-1] defaults to en_US when the order carries no locale`                          | AC-1                    | absent/empty/null locale normalises to `en_US`                                                                                        |
| `lib/orders/locale.test.ts › normaliseOrderLocale › returns the given identifier unchanged when present`                                | — (supporting)          | a supplied identifier is passed through, not re-parsed                                                                                |
| `lib/email/render.test.ts › renderCustomerEmail › [AC-2] renders a Japanese order's shipment email from the Japanese shipment template` | AC-2                    | `ja_JP` order → `shipment_ja_JP` template                                                                                             |
| `lib/email/render.test.ts › renderCustomerEmail › [AC-3] renders from the default template when the order locale cannot be resolved`    | AC-3                    | no-separator locale (`en`) → `approval_default`                                                                                       |
| `lib/email/render.test.ts › renderCustomerEmail › [AC-4] fails when the order locale resolves but has no template`                      | AC-4                    | `de_DE` parses but has no template → throws `EmailTemplateNotFoundError` with "No template found for locale de_DE", no email produced |
| `lib/email/render.test.ts › renderCustomerEmail › [AC-5] renders an en_US completed-order email with the unit price as $1,234.50`       | AC-5                    | end-to-end email body carries the formatted price                                                                                     |
| `lib/email/render.test.ts › renderCustomerEmail › [AC-6] renders a ja_JP completed-order email with the unit price as ￥2,000`          | AC-6                    | end-to-end email body carries the formatted price                                                                                     |
| `lib/email/render.test.ts › renderCustomerEmail › renders every kind for every supported template locale with a matching templateId`    | — (supporting)          | all 3 kinds × {en_US, ja_JP, zh_CN} select the matching template                                                                      |
| `lib/email/price.test.ts › formatEmailPrice › [AC-5] formats an en_US price as $#,##0.00`                                               | AC-5                    | `1234.5` → `$1,234.50`                                                                                                                |
| `lib/email/price.test.ts › formatEmailPrice › [AC-6] formats a ja_JP price as ￥#,##0`                                                  | AC-6                    | `2000` → `￥2,000`                                                                                                                    |
| `lib/email/price.test.ts › formatEmailPrice › formats a zh_CN price with the dollar pattern, per the legacy email template`             | — (supporting, Q2/SD-9) | `zh_CN` e-mails keep the dollar pattern, unlike storefront display                                                                    |
| `lib/email/price.test.ts › formatEmailPrice › formats the default template price with the dollar pattern`                               | — (supporting)          | base template uses the dollar pattern                                                                                                 |

## Red run

`bun run test -- lib/orders/locale.test.ts lib/email/price.test.ts lib/email/render.test.ts`, with `lib/orders/locale.ts`, `lib/email/types.ts`, `lib/email/price.ts`, `lib/email/render.ts` and `lib/email/templates/{approval,shipment,completed}.ts` moved aside so the tests hit no implementation:

```
FAIL  |server| lib/email/price.test.ts [ lib/email/price.test.ts ]
Error: Cannot find module './price' imported from /workspace/repo/lib/email/price.test.ts
FAIL  |server| lib/email/render.test.ts [ lib/email/render.test.ts ]
Error: Cannot find module './render' imported from /workspace/repo/lib/email/render.test.ts
FAIL  |server| lib/orders/locale.test.ts [ lib/orders/locale.test.ts ]
Error: Cannot find module './locale' imported from /workspace/repo/lib/orders/locale.test.ts

 Test Files  3 failed (3)
      Tests  no tests
```

## Green run

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck && bun run test`):

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  18 passed (18)
      Tests  56 passed (56)
```

`bun run verify:full` was also attempted; its E2E tier's preflight (`scripts/ensure-playwright-browser.mjs`) reports Chromium is not installed in this container ("Playwright's Chromium browser is not installed... in the agent workflow, E2E runs in the QA phase"). This ticket adds no UI surface (`PLAN.md` § Design reference: "No screen in this task"), so `verify` (lint + typecheck + full unit suite) is the applicable gate; the E2E tier is unaffected and re-runs at INTEGRATION_QA.

TDD-RESULT: 56 passed, 0 failed
