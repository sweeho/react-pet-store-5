---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0001
ticket: SWHR-T-0004
branch: vortex/feat/SWHR-T-0004-boilerplate-pet-store-branding-preline-d-7ad1c655
upstream: [artifacts/SWHR-S-0001/SWHR-T-0004/PLAN.md]
---

# TDD result — SWHR-T-0004

## Test cases

| Test                                                                    | Covers | Intent                                                                                                                                        |
| ----------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/constants/index.test.ts › STORE_NAME › is branded Pet Store`       | AC-2   | `STORE_NAME` reads "Pet Store", not the boilerplate placeholder                                                                               |
| `e2e/smoke.spec.ts › home page loads with no console errors` (extended) | AC-6   | root route still resolves to `/`, a level-1 heading is visible, no console error, alongside the existing `/api/hello` and `/api/users` checks |

The rest of this ticket (branding strings, Preline token adoption, font config, deleting
`tailwind.config.ts`) has no independently testable unit beyond the existing regression
suite; it is verified by the full pre-commit gate below plus a build-output check that the
required token utility classes actually compile (see `summary.md` → Verification).

## Red run

`bun run test -- src/constants/index.test.ts`

```
❯ |client| src/constants/index.test.ts (1 test | 1 failed) 3ms
   × is branded Pet Store 3ms
AssertionError: expected 'Your Store-Name' to be 'Pet Store'
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

Failed on the assertion (not a compile/import error), against the unmodified
`src/constants/index.ts`. A baseline full run at the same commit showed the other 20
existing tests (including `button.test.tsx`) still green: `Test Files 1 failed | 7 passed
(8)` / `Tests 1 failed | 20 passed (21)`.

The `e2e/smoke.spec.ts` URL assertion is additive to an already-passing spec (the root
route never redirected, so it does not have a meaningful pre-fix red state); it is proven
by the green run below plus the build/CSS checks in `summary.md`. Chromium is not
installed in this container (documented, expected — `bun run test:e2e`'s preflight fails
fast rather than downloading a browser), so the spec is unexecuted here; Validation runs it
in INTEGRATION_QA.

## Green run

`bun run verify` — this stack's full pre-commit gate (`bun run lint && bun run typecheck
&& bun run test`).

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run
 Test Files  8 passed (8)
      Tests  21 passed (21)
```

`bun run build` also ran clean (`tsc --build && vite build`, exit 0) as an additional check
that the CSS token rewrite compiles — see `summary.md` for the specific utility classes
confirmed present in the built CSS.

TDD-RESULT: 21 passed, 0 failed
