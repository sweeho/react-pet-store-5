# PLAN — SWHR-T-0004 Boilerplate: branding, Preline tokens, root-route smoke test

Change: `swhr-i-0002-bootstrap-landing-page-and-s` · tasks.md group 1 (1.1, 1.2). Read `openspec/changes/swhr-i-0002-bootstrap-landing-page-and-s/design.md` first.

## Objective

Extend the existing scaffold (never re-scaffold) so the app is branded Pet Store, styled from the Preline token set the mockups use, and guarded by a smoke test on the root route.

## Steps

1. Branding: `package.json` name `react-pet-store`; `index.html` title "Pet Store"; `STORE_NAME` in `src/constants/index.ts` → "Pet Store" (leave `API_BASE_URL` alone).
2. Tokens (design.md §Decisions taken at planning → Tokens; §Codebase findings → Design tokens): replace the shadcn token block in `src/index.css` with the `:root` / `.dark` / `@theme inline` content of `design/tokens.theme.css`, keeping `@import 'tw-animate-css'`. Add aliases for the names Button needs and Preline lacks (`--ring`, `--input`, `--accent`, `--accent-foreground`, plus any other class in `src/components/ui/button-variants.ts` that stops generating). Do not edit `design/tokens.theme.css`.
3. Fonts: `configs/fonts.config.ts` → Inter (400/500/600/700), Noto Sans JP 500, Noto Sans SC 500; set Inter as `--font-sans`.
4. Delete the empty `tailwind.config.ts` (SD-4).
5. Smoke: extend `e2e/smoke.spec.ts`'s root test to also assert the URL is still `/`. Keep the `/api/hello` and `/api/users` tests.
6. Leave `src/pages/index.tsx` content alone (SWHR-T-0005 replaces it) — its tests must still pass after the token swap.

## File/module ownership

`package.json`, `index.html`, `src/constants/index.ts`, `src/index.css`, `configs/fonts.config.ts`, `tailwind.config.ts` (delete), `e2e/smoke.spec.ts`.

## Design reference

`artifacts/SWHR-S-0001/design/mockup-site-shell.html` (colours and fonts to match via tokens), index `MANIFEST.md`.

## Definition of Done

AC-1 … AC-6 on the ticket.
