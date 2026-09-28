---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR-S-0004
ticket: SWHR-T-0048
idea: SWHR-I-0005
branch: Not Provided
upstream:
  [
    openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md,
    openspec/changes/swhr-i-0005-sign-on-and-access-control/specs/sign-on/spec.md,
  ]
---

# PLAN — SWHR-T-0048 · Sign-on test suite

Change `swhr-i-0005-sign-on-and-access-control` · tasks.md group 7. Read `openspec/changes/swhr-i-0005-sign-on-and-access-control/design.md` first: §Planning (findings, P1–P14, SD-1–SD-8) and §Interface contracts. Each approved test case in `openspec/changes/swhr-i-0005-sign-on-and-access-control/test-cases.md` for your scenarios becomes a test whose name carries its `SWHR-C-*` id (P14).

## Objective

Every approved case for this change is named by a passing test, and a standing test keeps it that way. The eight browser journeys pass against a database created fresh for each Playwright run.

## Steps

1. `lib/auth/scenarios/coverage.test.ts`: read `test-cases.md`, collect every approved `SWHR-C-*` id, and assert each appears on an `it`, `test` or `describe` line under `lib/`, `routes/`, `middleware/`, `src/` or `e2e/`. Find `test-cases.md` under `openspec/changes/swhr-i-0005-sign-on-and-access-control/` or, once archived, under `openspec/changes/archive/*-swhr-i-0005-sign-on-and-access-control/` (P14). The swhr-i-0004 coverage test broke when its change was archived. Add any case a previous ticket missed, in that ticket's style, without rewriting existing tests.
2. `e2e/sign-on.spec.ts`: SWHR-C-0103, 0106, 0117, 0130, 0132, 0134, 0135 and 0140. 0135 signs on, switches to Japanese, adds three items, then signs out. 0140 signs in as the seeded group member `admin_member` (P10). 0117 creates its own "alice" through the new-account form.
3. A fresh database per run: point Playwright's web server at a throwaway file through `SQLITE_PATH` (SWHR-T-0042), deleted before the server starts, and add that file to `.gitignore`. Existing specs must still pass on the fresh database.
4. Run the full E2E suite at least once before committing (AGENTS.md: a spec you have not executed is not a test).

## File/module ownership

- `lib/auth/scenarios/coverage.test.ts` (new); gap-filling tests beside the module they test
- `e2e/sign-on.spec.ts` (new), `playwright.config.ts`, `e2e/global-setup.ts`, `.gitignore`

## Definition of Done

- AC-1 and AC-2.

## Design reference

The journeys cross the pages drawn in `artifacts/SWHR-S-0004/design/` (see `MANIFEST.md`); assert on their visible copy.
