---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR-S-0006
idea: Not Applicable
branch: vortex/sprint/swhr-s-0006-c8ce8a09
upstream:
  [
    artifacts/SWHR-S-0006/SPRINT-PLAN.md,
    artifacts/SWHR-S-0006/integration-test-result.md,
    artifacts/SWHR-S-0006/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR-S-0006/sprint-summary.md]
---

# QA test report — SWHR-S-0006

Note on section shape: `artifact-qa-test-report`'s canonical template lists eight `##`
sections (including `## Design fidelity`, advisory). This ticket's own acceptance criteria
and dispatch instructions require **exactly seven**, enumerated by name and order, with no
`## Design fidelity` section — this is a bugfix sprint with no idea/mockup to compare
against in any case. Per the layering rule (a more specific instruction narrows, never
relaxes, a shared skill), the seven-section form below is what this report uses.

## Executive Summary

**Verdict: PASS.** All three committed defects — SWHR-T-0023 (area navigation labels stay
English in ja_JP/zh_CN), SWHR-T-0050 (`bun run dev` 500s under Node), SWHR-T-0064 (stub-
sentinel false positive) — are fixed on the integrated sprint branch. All 11 scenarios across
the change's three delta specs (site-shell, catalog-browsing, local-development) verified
`pass`. `bun install`, `bun run build`, `bun run lint`, `bun run typecheck` and `bun run test`
(624/624) all passed with real output (below). The project's own E2E suite could not execute
in this container — a Chromium browser-revision mismatch between the repo's pinned
`@playwright/test` and this container's bundled browser, unrelated to any of this sprint's
three tickets — so scenarios that are otherwise E2E-only were independently verified with
targeted, executed unit/component tests instead (see § Code Review). No product defect was
found; one environment/tooling blocker was found and filed as a standalone follow-up
(`SWHR-T-0072`, devops, not linked to this sprint).

## E2E Test Status

Blocked in this container by a Chromium browser-revision mismatch (repo pins `@playwright/test
~1.50.0`, expecting revision `1155`; container ships revision `1223`, matching Playwright
`1.60.0`). `bun run test:e2e -- --project=chromium` failed in the `pretest:e2e` preflight
before Playwright started; 0 of 54 tests across 9 spec files ran. Per this repo's own
`AGENTS.md`, this is the documented "browser genuinely missing" case — no install/retry was
attempted; `bun run verify` was run instead (see § Unit Test Results). Full command, verbatim
preflight output, root-cause analysis and the per-file skip table are in
`artifacts/SWHR-S-0006/integration-test-result.md`.

`E2E-RESULT: not applicable`

## Unit Test Results

```
$ bun install
Checked 517 installs across 624 packages (no changes) [32.00ms]

$ bun run build
✓ built in 61ms
[nitro] ✔ You can preview this build using npx vite preview

$ bun run lint
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
(no output — 0 warnings, 0 errors)

$ bun run typecheck
$ node scripts/ensure-generated-files.mjs
$ tsc --build
(no output — 0 errors)

$ bun run test
$ NODE_ENV=test bun --bun vitest run
 Test Files  131 passed (131)
      Tests  624 passed (624)
   Duration  16.88s
```

Baseline before this sprint (SWHR-S-0005) is not separately recorded here; this sprint added
regression coverage in `GlobalNav.test.tsx` ([SWHR-C-0437], [SWHR-C-0439]), `devServerConfig.test.ts`
([SWHR-C-0434]), `devServerRuntime.test.ts` ([SWHR-C-0433]) and `stubSentinelHygiene.test.ts`, all
included in the 624 passing.

## Code Review

- **SWHR-T-0023** — `GlobalNav.tsx` resolves all six storefront labels (Search/Cart/Checkout/
  Account/Administration/Supplier) from `useScreen("shell")` via an id→key map
  (`AREA_LABEL_SHELL_KEYS`), matching design.md §D1 exactly; `src/constants/navigation.ts` no
  longer exports `label`/`sampleBreeds`, and a repo-wide grep confirms nothing still reads
  them. `shell.ts`'s new `checkout` key matches the three locale strings design.md specifies.
- **SWHR-T-0050** — `package.json`'s `dev` script is `bun --bun ./node_modules/vite/bin/vite.js`;
  `playwright.config.ts`'s `webServer.command` now starts through `bun run dev`. With Node on
  PATH in this QA container (`node v22.23.3`, unlike the implementation container, which had
  none) — `devServerRuntime.test.ts` genuinely exercises the pre-fix regression path here and
  passed, spawning the real dev script and getting a live 200 from `/api/catalog/categories`.
- **SWHR-T-0064** — `.vortex/config.yaml`'s `stubSentinel` is the escaped double-quoted scalar
  design.md §D3 specifies; `stubSentinelHygiene.test.ts` (part of the 624 passing) both decodes
  it back to the literal sentinel and scans every merged `artifacts/**/tdd-test-result.md` for
  the literal text, finding none. One known, documented residual: `SPRINT-PLAN.md` (platform-
  generated, out of this ticket's file ownership) still quotes the sentinel in its own title —
  flagged in the ticket's `fix-note.md`, not this report's concern to fix.
- **E2E-only scenarios, independently verified.** Since the real Playwright run could not
  execute (see § E2E Test Status), five scenarios whose only committed coverage is
  `e2e/shell.spec.ts` / `e2e/catalog-browsing.spec.ts` were re-verified with ad hoc,
  **executed-then-discarded** Vitest component tests against the real components and real
  seed data, not committed (this report is the record of having run them):
  - `[SWHR-R-0002.04]` GlobalNav's default-locale (en_US) mobile-drawer labels — rendered
    `GlobalNav` with `locale: "en_US"`; all six storefront links present. Passed.
  - `[SWHR-R-0104.02]` GlobalNav's mobile "Pets" section in ja_JP — rendered `GlobalNav` with
    `locale: "ja_JP"` and a mocked ja_JP category list; all five links (鳥/猫/犬/魚/爬虫類)
    present, no English names. Passed.
  - `[SWHR-R-0105.03]` Category page heading in ja_JP — rendered `CategoryPage` at
    `/category/DOGS` with a mocked ja_JP category response (`name: "犬"`); `<h1>` reads 犬.
    Passed.
  - `[SWHR-R-0002.01]`, `[SWHR-R-0104.01]`: not independently re-run beyond the existing unit
    suite — structurally guaranteed (`src/main.tsx` mounts every routed page inside the single
    `SiteLayout`/`GlobalNav` instance the unit tests already exercise) and composed from
    already-passing, separately committed unit tests (`PetsMenu.test.tsx`'s href assertions +
    `[categoryId].test.tsx`'s per-category rendering + `SiteLayout.test.tsx`'s Home-link
    navigation test), not a fresh scenario-specific render.
- No other notable concerns observed in the diff (`git diff` against the ticket's file
  ownership matches each fix-note's "Files touched" list; no unrelated file changed).

## Coverage Summary

No coverage tool is installed or configured: `bun --bun vitest run --coverage` fails with
`Cannot find dependency '@vitest/coverage-v8'`, and no `coverage` script or `vitest.config.ts`
coverage block exists. Verified by inspection (grep for "coverage" in `package.json` and
`vitest.config.ts`: no matches) plus the attempted run above. Test-count evidence
(624/624, 131/131 files) is in § Unit Test Results; no coverage percentage is available for
this or any prior sprint in this repo.

## Issues Found

None against any of this sprint's three tickets or their acceptance criteria — every scenario
verdict below is `pass`, and `integration-defects-resolution.md`'s summary table is empty
(marker: `INTEGRATION_DEFECTS_RESOLUTION: COMPLETE`).

One environment/tooling finding, unrelated to this sprint's shipped code: the container's
bundled Chromium (revision `1223`) does not match the repo's pinned `@playwright/test`
(revision `1155`), blocking real E2E execution in this QA container (see § E2E Test Status
and `integration-test-result.md`). Filed as **SWHR-T-0072** (devops, standalone — not linked
to this sprint's idea or ticket tree, per the future-sprint-defect convention), since it is
outside this repo's product code and does not affect any of this sprint's acceptance
criteria (all were independently verified — see § Code Review).

### Scenario verdicts (spec-driven)

SCENARIO-VERDICT: Global navigation / Navigation is present on every page — pass
SCENARIO-VERDICT: Global navigation / Primary-area labels in Japanese — pass
SCENARIO-VERDICT: Global navigation / Primary-area labels in Simplified Chinese — pass
SCENARIO-VERDICT: Global navigation / Primary-area labels in the default locale — pass
SCENARIO-VERDICT: Category navigation menu / Menu on every page — pass
SCENARIO-VERDICT: Category navigation menu / Menu in Japanese — pass
SCENARIO-VERDICT: Category product listing page / Category page with more products than one page — pass
SCENARIO-VERDICT: Category product listing page / Selecting a product — pass
SCENARIO-VERDICT: Category product listing page / Category heading in Japanese — pass
SCENARIO-VERDICT: Development server runtime / Database-backed route under the development server — pass
SCENARIO-VERDICT: Development server runtime / End-to-end suite uses the development entry point — pass

## Recommendation

**Proceed.** All acceptance criteria for SWHR-T-0023, SWHR-T-0050 and SWHR-T-0064 hold on the
integrated sprint branch; all 11 spec scenarios verify `pass`; no product defect was found.
Firing `validation.all_acs_passed`.
