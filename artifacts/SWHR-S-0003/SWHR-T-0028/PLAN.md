---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0003
ticket: SWHR-T-0028
idea: SWHR-I-0004
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0004-partner-document-exchange/design.md,
    openspec/changes/swhr-i-0004-partner-document-exchange/specs/b2b-document-exchange/spec.md,
  ]
---

# PLAN — SWHR-T-0028 · XML infrastructure

Change `swhr-i-0004-partner-document-exchange` · tasks.md group 1. Read `openspec/changes/swhr-i-0004-partner-document-exchange/design.md` first: §Planning (findings, P1–P9, SD-1–SD-9) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0004-partner-document-exchange/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (SD-8).

## Objective

The shared XML layer every later ticket builds on exists under `lib/b2b/xml/`, with `lib/b2b/config.ts`, the bundled entity catalog and the two read-only HTTP endpoints. Malformed input is rejected, and schemas resolve in the specified order with a deployment override.

## Steps

1. Add `@xmldom/xmldom` and `xmllint-wasm` as dependencies (design.md P1). First confirm that the `xmllint-wasm` worker runs inside a `lib/**/*.test.ts` under the project's unit runner. If it does not, stop and escalate to planning rather than switching libraries.
2. `lib/b2b/xml/errors.ts`, `build.ts`, `serialize.ts`, `parse.ts`, `read.ts` and `dates.ts`, exactly per §Interface contracts. The serializer emits the UTF-8 declaration and indented output, and a DOCTYPE when one is passed. The parser turns every xmldom `fatalError` into `MalformedDocumentError`.
3. `lib/b2b/xml/doctype.ts`: `checkDocumentType`, per `SWHR-R-0045` (no DOCTYPE passes).
4. `lib/b2b/schemas/catalog.ts`: the bundled identifier-to-file map for every identifier in design.md P9, including PurchaseOrder 1.0 (the legacy "#Old DTDs"). Map both the public id and, for the TPA documents, the namespace. Files that later tickets add may not exist yet; the map names them anyway.
5. `lib/b2b/xml/resolver.ts`: `resolveEntity` in the four-step order of `SWHR-R-0048` (caller resolver → catalog, with `B2B_ENTITY_CATALOG` overriding the bundled entry → the document's system location → a bundled resource at that path), returning `null` for default resolution. A deployment catalog is a `.properties`-style `publicId=location` file.
6. `lib/b2b/xml/validate.ts`: `validateDocument` resolves its schema through `resolveEntity`, preloads included schemas, and returns `{ valid, errors }`. It never throws for a schema violation (SD-9).
7. `lib/b2b/config.ts`, per design.md P7.
8. `routes/api/b2b/entity-catalog.get.ts` (identifier → `/api/b2b/schemas/<file>` mappings, as text) and `routes/api/b2b/schemas/[file].get.ts` (serves a bundled schema file, 404 for any name not in the catalog; no path traversal), per design.md P8.

## File/module ownership

- `package.json`, `bun.lock` (the two dependencies only)
- `lib/b2b/xml/**` and tests (new)
- `lib/b2b/config.ts` + test (new)
- `lib/b2b/schemas/catalog.ts` + test (new)
- `routes/api/b2b/**` and tests (new)

## Definition of Done

- AC-1 (`Malformed and invalid document handling — Malformed document`)
- AC-2 (`Schema resolution — Deployment catalog overrides bundled mapping`)
- AC-3 (`Schema resolution — Unmapped identifier`)
