# TDD result — SWHR-T-0159

## Test cases

- SWHR-C-0428 approved e-mail for 1001, SWHR-C-0429 denied e-mail for 1002, SWHR-C-0430 shipment headers and rows: `lib/email/templates/templates.test.ts` (DOM-parsed, jsdom docblock).
- Also in that file: completed e-mail lists every line, subjects per locale, inline-only styles, ja_JP/zh_CN wording, HTML escaping. `lib/email/html.test.ts` covers `escapeHtml`. `lib/email/render.test.ts` keeps the localization scenarios.

## Notes

- Red run id: 13e0a6ea-28a5-4f3a-84e1-622600cf0404 (commit bc1fb40, all three cases failed on assertions).
- Green run id: 2d79de7c-59d1-41bd-af41-3623f3b7afc5 (commit e2a9c08, all three pass).
- Full gate `bun run verify` (lint, typecheck, unit): exit 0, 196 files, 1014 tests passed.
- After red, the subjects test fixture gained `decision: "APPROVED"` (a fixture omission of mine; assertions unchanged).
