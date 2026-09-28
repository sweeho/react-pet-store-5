---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0029
branch: vortex/feat/SWHR-T-0029-shared-document-elements-contactinfo-add-7fe3fc55
upstream: [artifacts/SWHR-S-0003/SWHR-T-0029/PLAN.md]
---

# TDD result — SWHR-T-0029

## Test cases

| Test                                                                                                                      | Covers                 | Intent                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `lib/b2b/elements/contactInfo.test.ts › [SWHR-C-0053] accepts an empty Email element`                                     | AC-1 (SWHR-R-0027.01)  | empty `<Email/>` is accepted, read back as `""`                                                          |
| `lib/b2b/elements/contactInfo.test.ts › [SWHR-C-0054] rejects an empty Phone element`                                     | AC-2 (SWHR-R-0027.02)  | empty `<Phone/>` throws `Phone element: content expected.`                                               |
| `lib/b2b/elements/contactInfo.test.ts › [SWHR-C-0055] rejects GivenName before FamilyName, naming FamilyName as expected` | AC-3 (SWHR-R-0027.03)  | out-of-order children throw `FamilyName element expected.`                                               |
| `lib/b2b/elements/address.test.ts › [SWHR-C-0056] writes exactly one StreetName when the second street line is empty`     | AC-4 (SWHR-R-0028.01)  | empty second street line → one `StreetName`, then City/State/ZipCode/Country                             |
| `lib/b2b/elements/address.test.ts › [SWHR-C-0057] emits an empty State element in position when state is missing`         | AC-5 (SWHR-R-0028.02)  | absent state → empty `<State/>` between City and ZipCode                                                 |
| `lib/b2b/elements/address.test.ts › [SWHR-C-0058] rejects an empty City`                                                  | AC-6 (SWHR-R-0029.01)  | empty `<City/>` throws `City element: content expected.`                                                 |
| `lib/b2b/elements/address.test.ts › [SWHR-C-0059] rejects a missing Country, naming it as expected`                       | AC-7 (SWHR-R-0029.02)  | no `Country` child throws `Country element expected.`                                                    |
| `lib/b2b/elements/address.test.ts › [SWHR-C-0060] rejects a present but empty second StreetName`                          | AC-8 (SWHR-R-0029.03)  | present-but-empty second `StreetName` throws                                                             |
| `lib/b2b/elements/creditCard.test.ts › [SWHR-C-0061] round-trips with children in order`                                  | AC-9 (SWHR-R-0030.01)  | write→read preserves the three values; children in `CardNumber, CardType, ExpiryDate` order              |
| `lib/b2b/elements/creditCard.test.ts › [SWHR-C-0062] rejects a ContactInfo node offered as a credit card`                 | AC-10 (SWHR-R-0030.02) | wrong node type throws `CreditCard element expected.`                                                    |
| `lib/b2b/elements/lineItem.test.ts › [SWHR-C-0063] rejects a non-numeric Quantity and produces no line item`              | AC-11 (SWHR-R-0031.01) | `Quantity` of `two` throws, no item returned                                                             |
| `lib/b2b/elements/lineItem.test.ts › [SWHR-C-0064] rejects a missing UnitPrice, naming it as expected`                    | AC-12 (SWHR-R-0031.02) | missing `UnitPrice` throws `UnitPrice element expected.`                                                 |
| `lib/b2b/elements/lineItem.test.ts › [SWHR-C-0065] exports ordered quantity only, with no shipped-quantity value`         | AC-13 (SWHR-R-0032.01) | `toExportLineItem` on a 5-ordered/3-shipped line carries quantity 5 and no `quantityShipped` field/value |

Every other function this ticket introduces (`writeAddress`/`writeContactInfo`/`writeCreditCard`/`writeLineItem`
round trips, the `Address`/`ContactInfo`/`CreditCard`/`LineItem` "wrong root element" rejections, and the four
bundled `.dtd.xsd` schemas) is exercised by supporting unit tests in the matching `*.test.ts` file — no approved
case id exists for these since they are round-trip/negative coverage of the interface contract itself, not a
numbered spec scenario. `lib/b2b/schemas/elements.dtd.xsd.test.ts` validates a well-formed document of each of
the four element types against its bundled `.dtd.xsd`, and one structural violation, through `validateDocument`.

## Red run

`NODE_ENV=test bun --bun vitest run lib/b2b/elements`, with `address.ts`/`contactInfo.ts`/`creditCard.ts`/`lineItem.ts`
swapped for stubs throwing `VortexNotImplemented` (exported interfaces and function signatures kept intact so
only behaviour, not imports or types, was missing):

```
Test Files  4 failed (4)
     Tests  20 failed (20)
```

All 20 tests in the four new element test files failed — 3 against `writeAddress`/`readAddress`-shaped VortexNotImplemented
throws, and so on for ContactInfo, CreditCard and LineItem — reproduced on this run (a single execution; no flake
observed). The schema-validation test file (`elements.dtd.xsd.test.ts`) was not part of this stub swap since it
exercises the schema files, not the element reader/writer code — it was green throughout.

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + the complete unit/integration suite),
with the real implementation restored:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run
 Test Files  59 passed (59)
      Tests  245 passed (245)
```

245 = SWHR-T-0028's baseline of 220 plus this ticket's 25 (20 element tests + 5 schema-validation tests) — zero
new failures, zero regressions.

`bun run verify:full`'s E2E tier was attempted and its preflight reported Chromium is not installed in this
container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing) — per AGENTS.md this means fall back to
`verify` rather than retry or install a browser. This ticket has no UI, so the E2E tier would not have exercised
anything it touches; Validation's E2E run at integration QA covers the existing storefront regression suite
unchanged.

TDD-RESULT: 245 passed, 0 failed
