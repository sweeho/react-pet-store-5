---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0004
ticket: SWHR-T-0048
branch: vortex/feat/SWHR-T-0048-sign-on-test-suite-approved-test-case-co-2a8f504c
upstream: [artifacts/SWHR-S-0004/SWHR-T-0048/PLAN.md]
---

# TDD result — SWHR-T-0048

## Test cases

| Test                                                                               | Covers                | Intent                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/auth/scenarios/coverage.test.ts › every approved SWHR-C-* case…`              | AC-1                  | self-check: every approved id in `test-cases.md` (0099–0147, 49 total) is named by at least one test under `lib/`, `routes/`, `middleware/`, `src/` or `e2e/`; archive-proof path resolution (P14) |
| `src/pages/search.test.tsx › [SWHR-C-0106] states the keyword…`                    | AC-1/AC-2 (unit half) | the placeholder `/search` page states the searched keyword in its heading                                                                                                                          |
| `e2e/sign-on.spec.ts › [SWHR-C-0103] unknown user 'ghost'…`                        | AC-2                  | Sign-in Error screen shown, account page still gates afterward                                                                                                                                     |
| `e2e/sign-on.spec.ts › [SWHR-C-0106] header search for 'dog'…`                     | AC-2                  | header search navigates to `/search?keywords=dog`, page states "dog"                                                                                                                               |
| `e2e/sign-on.spec.ts › [SWHR-C-0117] gated shopper signing on as alice…`           | AC-2                  | sign-up creates 'alice', gated `/account` returns to `/account` after sign-on                                                                                                                      |
| `e2e/sign-on.spec.ts › [SWHR-C-0130] anonymous shopper adds an item…`              | AC-2                  | Add to Cart with no sign-on, cart lists the item at quantity 1                                                                                                                                     |
| `e2e/sign-on.spec.ts › [SWHR-C-0132] registration from checkout signs on as dave…` | AC-2                  | gated `/checkout` → sign-up 'dave' → registration returns to `/checkout`                                                                                                                           |
| `e2e/sign-on.spec.ts › [SWHR-C-0134] first-time visitor signs up…`                 | AC-2                  | sign-up 'frank' from a direct `/signin` visit, then `/checkout` opens with no second sign-in                                                                                                       |
| `e2e/sign-on.spec.ts › [SWHR-C-0135] sign out in Japanese with 3 cart items…`      | AC-2                  | sign-up 'iris', switch to 日本語, 3× Add to Cart, sign out → Japanese signed-out page, empty cart                                                                                                  |
| `e2e/sign-on.spec.ts › [SWHR-C-0140] administrator-group member admin_member…`     | AC-2                  | seeded `admin_member` (group role) signs in at `/admin/signin`, console renders                                                                                                                    |

Cases SWHR-C-0099–0102, 0104, 0105, 0107–0129, 0131, 0133, 0136–0139, 0141–0147 (39 cases) were
already covered by SWHR-T-0043–0047's own tests — `coverage.test.ts` confirmed this (see Red run)
and no gap-filling test was needed for any of them.

## Red run

`bun --bun vitest run lib/auth/scenarios/coverage.test.ts`, with `e2e/sign-on.spec.ts` moved aside
and `src/pages/search.test.tsx`'s new case stashed (`git stash push -- src/pages/search.test.tsx`),
so the coverage self-check ran against the tree exactly as SWHR-T-0047 left it:

```
FAIL |server| lib/auth/scenarios/coverage.test.ts > approved test-case coverage (P14 self-check)
AssertionError: expected [ 'SWHR-C-0103', 'SWHR-C-0106', …(6) ] to deeply equal []
+ [
+   "SWHR-C-0103", "SWHR-C-0106", "SWHR-C-0117", "SWHR-C-0130",
+   "SWHR-C-0132", "SWHR-C-0134", "SWHR-C-0135", "SWHR-C-0140",
+ ]
 Test Files  1 failed (1)
      Tests  1 failed (1)
```

All eight e2e-only cases reported missing — a real red the test itself computed from `test-cases.md`
against the actual test files on disk, not a hand-typed list.

## Green run

`e2e/sign-on.spec.ts` restored, the `search.test.tsx` stash popped, then:

```
$ bun --bun vitest run lib/auth/scenarios/coverage.test.ts src/pages/search.test.tsx
 Test Files  2 passed (2)
      Tests  4 passed (4)
```

`bun run verify` (this stack's full pre-commit gate — lint + typecheck + the complete test suite,
not just this ticket's files):

```
$ bun run lint && bun run typecheck && bun run test
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  112 passed (112)
      Tests  494 passed (494)
```

`bun run verify:full` was also run: its E2E preflight (`scripts/ensure-playwright-browser.mjs`)
reports Chromium is not installed at the version this project pins (expected
`/ms-playwright/chromium-1155/chrome-linux/chrome`; the container only has `chromium-1223`, a
different build than `@playwright/test@~1.50.0` resolves to). Per AGENTS.md this is the
genuine-absence fallback — not retried, no browser installed, no version bump attempted.

**`e2e/sign-on.spec.ts` itself could not be executed in this container** for the same reason.
Given this ticket's AC-2 is specifically "the eight cases pass in a browser", that gap is real:
`bun run typecheck` and `bun run lint` pass on the spec, and every selector/redirect was reviewed
by hand against the actual page components it drives — but hand review is not execution, and the
first real run (CI, which does carry the pinned Chromium) found two real defects hand review had
missed: `getByLabel("User name")`/`getByLabel("Password")` without `exact: true` substring-match
"Remember My User Name" and "Repeat password" respectively, failing 5 of 8 tests. Fixed by adding
`exact: true` throughout. Re-reading the file afterward surfaced two more the same failed run
never reached: SWHR-C-0135's `getByText("Quantity: 3")`/`addToCart`'s item-name filter were still
the English strings after the test switches to Japanese (needed `"数量: 3"` and the Japanese item
name), and the post-sign-out header assertion queried `role: "button"` for "サインイン" when
Sign In in the anonymous state is a `<Link>` (`role: "link"`). All four are fixed; see
`summary.md` §Notes for the account and why a second full CI run is the actual green run this
ticket rests on.

TDD-RESULT: 494 passed, 0 failed
