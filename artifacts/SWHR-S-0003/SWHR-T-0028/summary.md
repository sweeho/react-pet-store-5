---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0003
ticket: SWHR-T-0028
branch: vortex/feat/SWHR-T-0028-xml-infrastructure-parser-serializer-pos-fdf4eb8c
upstream: [artifacts/SWHR-S-0003/SWHR-T-0028/PLAN.md]
downstream: [artifacts/SWHR-S-0003/qa-test-report.md]
---

# Summary — SWHR-T-0028: XML infrastructure — parser, serializer, positional readers, validation, document type check and entity catalog

## What changed

Added the shared `lib/b2b/xml/*` layer (build/serialize/parse/positional-read/dates/doctype/resolver/validate),
`lib/b2b/config.ts`, the bundled schema identifier catalog, and the two read-only
`routes/api/b2b/**` endpoints that later document-type tickets (SWHR-T-0029 onward) build on. Added
`@xmldom/xmldom` and `xmllint-wasm` as the two new dependencies (design.md P1).

## Files

- `lib/b2b/xml/errors.ts` — `MissingValueError`, `MalformedDocumentError`, `DocumentReadError`.
- `lib/b2b/xml/build.ts` — `createDocument`, `appendTextElement`.
- `lib/b2b/xml/serialize.ts` — `serializeDocument`/`DocTypeDecl`; hand-rolled indentation (xmldom's serializer has none), leaf elements delegated to `XMLSerializer` for correct escaping.
- `lib/b2b/xml/parse.ts` — `parseDocument`; converts xmldom's `fatalError` into `MalformedDocumentError`.
- `lib/b2b/xml/read.ts` — `ChildReader`, `expectRoot`.
- `lib/b2b/xml/dates.ts` — `formatDocumentDate`, `parseDocumentDate` (P3).
- `lib/b2b/xml/doctype.ts` — `checkDocumentType`, `unquoteDeclaredId` (SWHR-R-0045).
- `lib/b2b/xml/resolver.ts` — `resolveEntity`, `ResolvedEntity`, `EntityResolver` (SWHR-R-0048).
- `lib/b2b/xml/validate.ts` — `validateDocument`/`ValidationResult`, backed by `xmllint-wasm`.
- `lib/b2b/config.ts` — `isValidationEnabled`, `getSchemaForm`, `getEntityCatalogPath` (P7).
- `lib/b2b/schemas/catalog.ts` — `BUNDLED_SCHEMA_CATALOG`, `lookupBundledSchemaFile` (P9).
- `lib/b2b/schemas/files/.gitkeep` — placeholder; later tickets add the actual `.dtd`/`.xsd` files this catalog names.
- `routes/api/b2b/entity-catalog.get.ts` — publishes identifier → `/api/b2b/schemas/<file>` as text (P8).
- `routes/api/b2b/schemas/[file].get.ts` — serves a bundled schema file; 404 outside the catalog whitelist.
- One `*.test.ts` per file above, plus `package.json`/`bun.lock` (the two new dependencies).

## AC coverage

- AC-1 (Malformed document) — `lib/b2b/xml/parse.ts`'s `parseDocument`, covered by `parse.test.ts › [SWHR-C-0087]`.
- AC-2 (Deployment catalog overrides bundled mapping) — `lib/b2b/xml/resolver.ts`'s `resolveEntity`, covered by `resolver.test.ts › [SWHR-C-0091]`.
- AC-3 (Unmapped identifier) — same `resolveEntity`, covered by `resolver.test.ts › [SWHR-C-0092]`.

## Verification

```
$ bun run verify
lint ✓  typecheck ✓
Test Files  54 passed (54)
     Tests  220 passed (220)
$ bun run verify:full
... E2E preflight: Chromium not installed in this container — expected per AGENTS.md,
    fell back to `verify` (no UI in this ticket to exercise anyway).
```

See `tdd-test-result.md` — `TDD-RESULT: 220 passed, 0 failed`.

## Notes

- **xmldom DOCTYPE quoting (undocumented-by-contract detail).** xmldom's parsed `doctype.publicId`/
  `systemId` retain their surrounding quote characters (the PubidLiteral/SystemLiteral grammar), so
  `checkDocumentType` and any future reader comparing a declared id against a bare identifier must go
  through `unquoteDeclaredId` first. `serializeDocument` sidesteps the same quirk on the write side by
  writing the `<!DOCTYPE …>` line itself from the passed `DocTypeDecl`, never through xmldom's own
  `DocumentType` node.
- **Indentation is hand-rolled.** `@xmldom/xmldom`'s `XMLSerializer` has no pretty-print option; leaf
  elements (text-only or empty) are still serialized through it for correct escaping, and only the
  open/close tags of elements with element children are assembled manually.
- **`validateDocument` fails open (SD-9).** An unresolvable or not-yet-authored schema (this ticket
  ships the catalog's filenames, not the `.dtd`/`.xsd` bytes — those are later tickets') returns
  `{ valid: true, errors: [] }` rather than throwing, matching SWHR-R-0048's "fall back to default
  resolution rather than fail" and never blocking a caller on missing infrastructure.
- **Minor deviation from PLAN.md step 1's escalation trigger:** the toolchain probe passed (confirmed
  with a throwaway smoke test under `bun --bun vitest`, then removed), so no escalation to planning was
  needed.
