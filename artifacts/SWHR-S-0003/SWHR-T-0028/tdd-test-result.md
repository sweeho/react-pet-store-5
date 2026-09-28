---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0028
branch: vortex/feat/SWHR-T-0028-xml-infrastructure-parser-serializer-pos-fdf4eb8c
upstream: [artifacts/SWHR-S-0003/SWHR-T-0028/PLAN.md]
---

# TDD result — SWHR-T-0028

## Test cases

| Test                                                                                                                             | Covers                                               | Intent                                                                |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| `lib/b2b/xml/parse.test.ts › [SWHR-C-0087] rejects a document with an unclosed element and never calls the downstream processor` | AC-1 (SWHR-R-0046.01)                                | malformed XML throws `MalformedDocumentError`, downstream never runs  |
| `lib/b2b/xml/resolver.test.ts › [SWHR-C-0091] deployment catalog location wins over the bundled mapping`                         | AC-2 (SWHR-R-0048.01)                                | deployment `.properties` override beats the bundled catalog entry     |
| `lib/b2b/xml/resolver.test.ts › [SWHR-C-0092] unmapped identifier uses the schema location named in the document`                | AC-3 (SWHR-R-0048.02)                                | identifier in neither catalog falls back to the document's `systemId` |
| `lib/b2b/xml/doctype.test.ts › [SWHR-C-0085] rejects a document declaring a different document type`                             | SWHR-R-0045.01 (doctype check, built by this ticket) | mismatched declared public id → `Document not of type`                |
| `lib/b2b/xml/doctype.test.ts › [SWHR-C-0086] passes a document with no DOCTYPE declared`                                         | SWHR-R-0045.02                                       | no DOCTYPE → check passes                                             |

Every other function this ticket introduces (`createDocument`/`appendTextElement`, `serializeDocument`,
`ChildReader`/`expectRoot`, `formatDocumentDate`/`parseDocumentDate`, `resolveEntity`'s resolver/null
paths, `validateDocument`, `lib/b2b/config.ts`, `lib/b2b/schemas/catalog.ts`, and the two
`routes/api/b2b/**` handlers) is exercised by supporting unit/integration tests in the matching
`*.test.ts` file next to each source file — no separate approved case id exists for these, since they
are the interface contract itself rather than a numbered spec scenario.

## Red run

`NODE_ENV=test bun --bun vitest run lib/b2b routes/api/b2b`, with every implementation file under
`lib/b2b/**` and `routes/api/b2b/**` swapped for a stub throwing `VortexNotImplemented` (exports and
types kept intact so only behaviour, not imports, was missing):

```
Test Files  12 failed (12)
     Tests  68 failed | 1 passed (69)
```

The 1 pass (`catalog.test.ts › has a unique file for every identifier`) is a `new Set([]).size === [].length`
check that holds vacuously for the stub's empty catalog array — not a false red; the adjacent
"maps every identifier in design.md P9" test in the same file failed as expected.

## Green run

`bun run verify` — this stack's full pre-commit gate (lint + typecheck + the complete unit/integration
suite), with the real implementation restored:

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(clean)
$ tsc --build
(clean)
$ NODE_ENV=test bun --bun vitest run
 Test Files  54 passed (54)
      Tests  220 passed (220)
```

`bun run verify:full`'s E2E tier was attempted and its preflight reported Chromium is not installed in
this container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing) — per AGENTS.md this means
fall back to `verify` rather than retry or install a browser. This ticket has no UI, so the E2E tier
would not have exercised anything it touches; Validation's E2E run at integration QA covers the
existing storefront regression suite unchanged.

TDD-RESULT: 220 passed, 0 failed
