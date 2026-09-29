# Bugfix batch SWHR-S-0006: shell area labels, dev-server runtime, stub-sentinel false positives

## Why

Three defects, one change (idea-less defect batch):

- **SWHR-T-0023** — the Global navigation's area links (desktop Search/Checkout; mobile menu Search/Cart/Checkout/Account/Administration/Supplier) render the untranslated `label` field of `PRIMARY_AREAS` in `src/constants/navigation.ts`, so they stay English in ja_JP and zh_CN. Re-verified on the sprint base: the pet-category half of the report was already fixed by SWHR-S-0005, which moved every category label onto the locale-scoped catalog API (`category.name`). The area labels were not moved, and no scenario checks either one in a non-English locale.
- **SWHR-T-0050** — the `dev` script is plain `vite`. Vite's bin has a `#!/usr/bin/env node` shebang, so `bun run dev` runs the dev server under Node whenever Node is on PATH, and any route that loads `db/client.ts` (`bun:sqlite`) fails with a 500. The Playwright web server already avoids this by running `bun --bun ./node_modules/vite/bin/vite.js` (see the header of `.github/workflows/ci.yml`), so E2E never exercises the script developers actually run.
- **SWHR-T-0064** — the platform's green-phase stub-sentinel scan matches the literal sentinel string anywhere in the repository. That includes its declaration in `.vortex/config.yaml` and prose in merged `artifacts/**/tdd-test-result.md` files, and it has marked every green run invalid since SWHR-S-0004 (SWHR-T-0057, -0058, -0059, -0061).

## What Changes

- The Global navigation resolves every area label from the `shell` screen by area id. `PRIMARY_AREAS`/`PET_CATEGORIES` keep only identity and routing.
- New regression scenarios pin the ja_JP/zh_CN area labels, the ja_JP Pets menu and the ja_JP category heading.
- The `dev` script forces the Bun runtime, and the Playwright web server starts through that script, so E2E covers it.
- The repository stops carrying the literal sentinel string outside live stubs. This is a repo-side mitigation; the durable fix belongs to the platform scanner (see design.md §D3).

## Impact

- Capabilities: `site-shell` (MODIFIED Global navigation), `catalog-browsing` (MODIFIED Category navigation menu, Category product listing page), `local-development` (ADDED, new capability).
- Code: `src/constants/navigation.ts`, `src/components/layout/GlobalNav.tsx`, `src/i18n/screens/shell.ts`, `package.json`, `playwright.config.ts`, `.vortex/config.yaml`, historical `artifacts/**/tdd-test-result.md` prose.
- Follow-ups (out of scope, not filed; planning has no DEFECT authority):
  - F1: scope the platform's green stub-sentinel scan to the ticket's red→green diff or to source/test call sites. This is the durable fix for SWHR-T-0064's AC-3.
  - F2: `preview` is also plain `vite preview` and may hit the same Node-shebang runtime issue if it serves Nitro routes. It is unverified, so it was left out of scope.
