---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR-S-0001
ticket: SWHR-T-0004
branch: vortex/feat/SWHR-T-0004-boilerplate-pet-store-branding-preline-d-7ad1c655
upstream: [artifacts/SWHR-S-0001/SWHR-T-0004/PLAN.md]
downstream: [artifacts/SWHR-S-0001/qa-test-report.md]
---

# Summary — SWHR-T-0004: Boilerplate Pet Store branding, Preline tokens, root-route smoke test

## What changed

Rebranded the existing Vite/React/Nitro scaffold to Pet Store, replaced the shadcn OKLCH
token block in `src/index.css` with the Preline token set from `design/tokens.theme.css`
(plus shadcn-compatibility aliases for `ring`/`input`/`accent`/`accent-foreground`), swapped
the loaded Google Font from Space Grotesk to Inter + Noto Sans JP/SC, and deleted the empty
`tailwind.config.ts`. No existing behaviour (routing, `src/pages/index.tsx` content, the
`Button` component) was touched.

## Files

- `package.json` — name `react-ts-starter` → `react-pet-store`.
- `index.html` — `<title>` → "Pet Store".
- `src/constants/index.ts` — `STORE_NAME` → "Pet Store".
- `src/constants/index.test.ts` — new, pins `STORE_NAME`.
- `src/index.css` — token block replaced wholesale with `design/tokens.theme.css`'s
  `:root` / `.dark` / `@theme` / `@theme inline` content (kept `@import 'tw-animate-css'`),
  plus 4 alias lines in `@theme inline` (`--color-ring`, `--color-input`, `--color-accent`,
  `--color-accent-foreground`) mapped onto the nearest Preline semantics (`border-line-4`,
  `layer-line`, `surface`, `surface-foreground`) since Preline has no equivalents.
- `configs/fonts.config.ts` — Inter 400/500/600/700, Noto Sans JP 500, Noto Sans SC 500
  (Preline's `--font-sans` already names Inter first, so no CSS change was needed for the
  body font).
- `tailwind.config.ts` — deleted (was empty; SD-4).
- `e2e/smoke.spec.ts` — root-route test now also asserts the URL is still `/`.

## AC coverage

- AC-1 (scaffold extended, not re-scaffolded; build/typecheck/lint/unit green) —
  `bun run build`, `bun run verify` below; no new tooling introduced.
- AC-2 (title "Pet Store", package `react-pet-store`, `STORE_NAME` "Pet Store") —
  `index.html`, `package.json`, `src/constants/index.ts`; covered by
  `src/constants/index.test.ts` and confirmed in the built server template
  (`<title>Pet Store</title>`).
- AC-3 (Preline tokens resolve, including the shadcn names Button needs) — `src/index.css`;
  confirmed by inspecting the built CSS (see Verification) for `bg-background`,
  `text-foreground`, `bg-primary`, `hover:bg-primary-hover`, `border-line-2`,
  `text-muted-foreground-1`, `focus-visible:ring-ring`, `border-input`, `hover:bg-accent`,
  `hover:text-accent-foreground`; `button.test.tsx`'s 5 tests stay green.
- AC-4 (Inter body font, Noto Sans JP/SC loaded) — `configs/fonts.config.ts`; confirmed in
  the built HTML template, which requests `Inter:wght@400;500;600;700`,
  `Noto+Sans+JP:wght@500`, `Noto+Sans+SC:wght@500`.
- AC-5 (empty `tailwind.config.ts` deleted) — `git rm tailwind.config.ts`.
- AC-6 (smoke test) — `e2e/smoke.spec.ts`; root test now asserts response ok, URL `/`,
  visible level-1 heading, no console errors; `/api/hello` and `/api/users` tests
  unchanged. Not executable in this container (see Notes) — Validation runs it in
  INTEGRATION_QA.

## Verification

```
$ bun run test              # 8 files, 21 tests passed (incl. new STORE_NAME test + button.test.tsx)
$ bun run verify             # lint + typecheck + test, all green
$ bun run build              # tsc --build && vite build, exit 0
```

Confirmed in the `bun run build` output (`.output/public/assets/index-*.css` and
`.output/server/_chunks/renderer-template.mjs`, both removed after inspection — build is
gitignored) that the required Preline utility classes compile:
`.bg-background`, `.text-foreground`, `.bg-primary`, `.hover\:bg-primary-hover`,
`.border-line-2`, `.text-muted-foreground-1`, and the shadcn aliases
`.focus-visible\:ring-ring{--tw-ring-color:var(--border-line-4)}`, `.border-input`,
`.bg-accent`, `.hover\:text-accent-foreground{color:var(--surface-foreground)}`; and that
the renderer template requests `Inter:wght@400;500;600;700`, `Noto Sans JP:wght@500`,
`Noto Sans SC:wght@500` with `<title>Pet Store</title>`.

See `tdd-test-result.md` — `TDD-RESULT: 21 passed, 0 failed`.

## Notes

- `bun run test:e2e` was not run: its preflight reports Chromium is not installed in this
  container (`/ms-playwright/chromium-1155/chrome-linux/chrome` missing) and explicitly
  says not to install it here — E2E runs in the QA-phase container / CI. `bun run verify`
  (lint + typecheck + unit) stands in, plus the build/CSS check above for the parts only a
  real compile can prove.
- The `--ring`/`--input`/`--accent`/`--accent-foreground` alias targets (`border-line-4`,
  `layer-line`, `surface`, `surface-foreground`) are a judgment call, not specified by
  `design.md` beyond "alias the shadcn names Button uses onto Preline values" — chosen for
  the closest semantic match (a neutral focus ring, an input border, a neutral hover
  surface) rather than reusing `primary`, so `Button`'s `outline`/`ghost` hover states stay
  visually neutral like the rest of the Preline palette.
- Left `README.md`'s two remaining `react-ts-starter` references (`Docker build`/`run`
  examples) as-is — outside this ticket's file ownership and outside `AGENTS.md`'s
  autonomous-docs remit.
