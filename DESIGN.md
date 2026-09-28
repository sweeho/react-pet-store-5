# Design System

See [PRODUCT.md](./PRODUCT.md) for what this is, [ARCHITECTURE.md](./ARCHITECTURE.md) for how it's built. The normative rules (contrast, focus, touch targets, motion) are in [design/DESIGN-GUIDE.md](./design/DESIGN-GUIDE.md); this file records how this project applies them.

## Tokens

The token source is the Preline set in [design/tokens.theme.css](./design/tokens.theme.css), carried into `src/index.css`: raw values in `:root` (light) and `.dark`, exposed as Tailwind utilities through `@theme inline`. Treat `design/tokens.theme.css` as read-only input; a value you need that it lacks is a design question, not a component-level token.

| Role          | Tailwind class                                                          |
| ------------- | ----------------------------------------------------------------------- |
| Page surfaces | `bg-background`, `bg-background-1`, `bg-background-2`                   |
| Text          | `text-foreground`, `text-muted-foreground-1`, `text-muted-foreground-2` |
| Brand action  | `bg-primary`, `hover:bg-primary-hover`, `text-primary-foreground`       |
| Lines         | `border-line-1`, `border-line-2`, `border-card-line`                    |
| Navigation    | `bg-navbar`, `border-navbar-line`, `hover:bg-navbar-nav-hover`          |
| Destructive   | `bg-destructive`, `text-destructive-foreground`                         |

The shadcn names the `src/components/ui/` primitives use (`ring`, `input`, `accent`, `accent-foreground`) are aliases onto Preline values in `src/index.css`, so those primitives keep working unchanged.

Mockups under `artifacts/<sprint>/design/` use literal hex values for portability. Build with the token that matches, never the hex.

## Typography

- Body and UI: **Inter** (400 / 500 / 600 / 700), set as `--font-sans`.
- Language labels in their own script: **Noto Sans JP** and **Noto Sans SC** (500).
- Fonts are declared in `configs/fonts.config.ts` and loaded by `unplugin-fonts`.

## Theming

Class-based dark mode: `.dark` on `<html>` switches every token. No toggle is wired yet; both appearances must still render correctly (DESIGN-GUIDE §2.9).

## Layout and the site shell

Every page renders inside one shell — header, one navigation landmark named **Global**, `main`, footer — and never draws its own chrome. Pages contribute only the content inside `main`. On narrow screens (below `lg`) the navigation folds behind a menu button and opens as a panel with the same entries. The entries come from one list, `src/constants/navigation.ts`; a new primary area adds an entry there rather than a second menu. Behaviour of record: `openspec/specs/site-shell/`.

## State frames

Pages never hand-roll "nothing here", "something went wrong" or "loading" markup. They use the shared frames in `src/components/state/`:

- **Empty** — icon, one short title, optional one line of copy and one action.
- **Error** — says the page could not be loaded; offers **Try again** when the failure is retryable and always a link back home. Not-found uses the same frame without Try again.
- **Loading** — a skeleton holding the content area's shape (DESIGN-GUIDE §10.6).

A page that fetches wraps its content in `AsyncContent`, which chooses between the three.

## Components

Pattern (see `src/components/ui/button.tsx` + `button-variants.ts`):

- Variants via `class-variance-authority`
- Class merging via `cn()` (`clsx` + `tailwind-merge`) — always last, so callers can override
- Polymorphism via Radix `Slot` (`asChild` prop)
- Variants exported from a separate `*-variants.ts` file, not the component file (avoids an `eslint-plugin-react-refresh` warning)

Shared primitives go in `src/components/ui/`, shell pieces in `src/components/layout/`, state frames in `src/components/state/`. Each follows this pattern and gets a `*.test.tsx`.

## Icons

`lucide-react` for general use, `@heroicons/react` for `@headlessui/react` overlays (the navigation panel).

## Animation

`tw-animate-css` — Tailwind v4-compatible successor to `tailwindcss-animate`. Nothing animates on page load (DESIGN-GUIDE §2.8).
