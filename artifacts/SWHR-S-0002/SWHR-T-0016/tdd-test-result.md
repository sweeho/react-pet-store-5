---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0002
ticket: SWHR-T-0016
branch: vortex/feat/SWHR-T-0016-forms-encoding-and-admin-strings-state-p-8e61d92d
upstream: [artifacts/SWHR-S-0002/SWHR-T-0016/PLAN.md]
---

# TDD result — SWHR-T-0016

## Test cases

| Test                                                                                                                                             | Covers                | Intent                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------ |
| `lib/locale/stateProvince.test.ts › getStateProvinceOptions › [AC-1] returns Tokyo, Osaka and Nagano for ja_JP`                                  | AC-1 (SWHR-R-0020.01) | Japanese order form offers the three Japanese prefectures                                              |
| `lib/locale/stateProvince.test.ts › getStateProvinceOptions › returns California, New York and Texas for en_US`                                  | SWHR-R-0020 backdrop  | English order form offers the three US states                                                          |
| `lib/locale/stateProvince.test.ts › getStateProvinceOptions › returns Beijing, Shanghai and Jiangsu for zh_CN`                                   | SWHR-R-0020 backdrop  | Chinese order form offers the three provinces                                                          |
| `lib/locale/stateProvince.test.ts › getStateProvinceOptions › falls back to the en_US list for an unsupported locale`                            | PLAN step 1           | An unsupported locale (e.g. `de_DE`) gets the en_US list, not an empty one                             |
| `src/components/forms/StateProvinceSelect.test.tsx › [AC-1] renders the Japanese prefecture choices for ja_JP`                                   | AC-1                  | The component surfaces the same three prefectures as radio options                                     |
| `src/components/forms/StateProvinceSelect.test.tsx › renders the English state choices for en_US`                                                | SWHR-R-0020 backdrop  | English locale renders California/New York/Texas                                                       |
| `src/components/forms/StateProvinceSelect.test.tsx › marks the current value as checked and the rest as unchecked`                               | Fixed interface       | The controlled `value` prop drives `aria-checked`                                                      |
| `src/components/forms/StateProvinceSelect.test.tsx › calls onChange with the selected option's value`                                            | Fixed interface       | Clicking an option calls `onChange` with that option's `value`                                         |
| `routes/api/users/index.post.test.ts › POST /api/users › [AC-2] round-trips a Japanese name byte-identical through create and read`              | AC-2 (SWHR-R-0021.01) | A Japanese name submitted via POST is stored and re-read identical, with a UTF-8 response Content-Type |
| `routes/api/users/index.post.test.ts › POST /api/users › round-trips a Chinese name byte-identical through create and read`                      | SWHR-R-0021 backdrop  | Same round-trip for Chinese text                                                                       |
| `routes/api/users/index.post.test.ts › POST /api/users › rejects a request missing name or email`                                                | Fixed interface       | A malformed body is rejected with HTTP 400, not a silent write                                         |
| `src/pages/admin/index.test.tsx › Admin page › renders the English catalogue by default`                                                         | SWHR-R-0022 backdrop  | English is the default admin catalogue                                                                 |
| `src/pages/admin/index.test.tsx › Admin page › [AC-3] renders the German catalogue's labels, tooltip and mnemonic for a German browser language` | AC-3 (SWHR-R-0022.01) | `navigator.language` starting `de` selects the German catalogue's label, tooltip and mnemonic          |

## Red run

`NODE_ENV=test bun --bun vitest run lib/locale/stateProvince.test.ts routes/api/users/index.post.test.ts src/components/forms/StateProvinceSelect.test.tsx src/pages/admin/index.test.tsx`, run with `lib/locale/stateProvince.ts`, `src/components/forms/StateProvinceSelect.tsx`, `routes/api/users/index.post.ts` and `src/i18n/admin/*` removed, and `src/pages/admin/index.tsx` reverted to its pre-ticket placeholder (temporarily, from a backup copy — not re-authored):

```
FAIL  lib/locale/stateProvince.test.ts — Cannot find module './stateProvince'
FAIL  routes/api/users/index.post.test.ts — Cannot find module './index.post'
FAIL  src/components/forms/StateProvinceSelect.test.tsx — Cannot find module './StateProvinceSelect'
FAIL  src/pages/admin/index.test.tsx
  ● Admin page › [AC-3] renders the German catalogue's ...
    Unable to find role="heading" with name "Verwaltung" — the placeholder page renders "Administration" regardless of navigator.language

 Test Files  4 failed (4)
      Tests  1 failed | 1 passed (2)
```

Three suites fail on unresolved imports (no implementation yet); the admin page suite resolves (the page already existed as a placeholder) but its new `[AC-3]` case fails on the actual assertion, since the placeholder has no locale-aware catalogue yet. The English-default case in that same suite incidentally already passed against the placeholder's hardcoded English text — expected, since it asserts the pre-ticket behaviour. All four implementation targets were then restored unchanged from a backup copy before continuing.

## Green run

`bun run verify` (`bun run lint && bun run typecheck && bun run test`) — the project's full pre-commit gate. (`bun run verify:full` also ran; its `test:e2e` tier fails only because this container has no Chromium installed — the documented, expected fallback in this case is `verify` alone.)

```
$ eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
$ tsc --build
$ NODE_ENV=test bun --bun vitest run

 Test Files  24 passed (24)
      Tests  78 passed (78)
```

All 24 suites (78 tests, including the 13 new tests above) pass; lint and `tsc --build` (both TypeScript projects) are clean.

TDD-RESULT: 78 passed, 0 failed
