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
| Charts        | `fill-chart-1` … `fill-chart-10`, in that order                         |
| Status        | see Status colours below                                                |

The shadcn names the `src/components/ui/` primitives use (`ring`, `input`, `accent`, `accent-foreground`) are aliases onto Preline values in `src/index.css`, so those primitives keep working unchanged.

Mockups under `artifacts/<sprint>/design/` use literal hex values for portability. Build with the token that matches, never the hex.

## Typography

- Body and UI: **Inter** (400 / 500 / 600 / 700), set as `--font-sans`.
- Language labels in their own script: **Noto Sans JP** and **Noto Sans SC** (500).
- Fonts are declared in `configs/fonts.config.ts` and loaded by `unplugin-fonts`.

## Theming

Class-based dark mode: `.dark` on `<html>` switches every token. No toggle is wired yet; both appearances must still render correctly (DESIGN-GUIDE §2.9).

## Layout and the site shell

Every page renders inside one shell — header, one navigation landmark named **Global**, `main`, footer — and never draws its own chrome. Pages contribute only the content inside `main`. On narrow screens (below `lg`) the navigation folds behind a menu button and opens as a panel with the same entries. Primary areas come from one list, `src/constants/navigation.ts`; a new primary area adds an entry there rather than a second menu. Behaviour of record: `openspec/specs/site-shell/`.

Storefront pages add a **Pets** side panel left of `main` from `lg` up: 232 px wide, an uppercase `text-muted-foreground-1` heading, one 40 px row per pet category, the current category highlighted with `bg-primary-50` and `text-primary-700`. Below `lg` the same entries sit under a "Pets" heading in the navigation panel. Its entries are the catalog's categories for the current locale (ARCHITECTURE.md §Key Decisions), never a hand-kept list.

## Paged lists

A list that pages shows **Previous** only when an earlier page exists and **Next** only when a later one does, as plain links under the list; never a disabled control and never page numbers. The page is part of the address (`start`, `count`), so a paged view can be bookmarked and the browser's Back button steps back through pages.

## Status colours

A status is always shown as its word on a tinted badge, so colour is never the only cue (DESIGN-GUIDE contrast rules apply to the text):

| Status    | Badge classes                                                              |
| --------- | -------------------------------------------------------------------------- |
| Pending   | `bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300` |
| Approved  | `bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300`     |
| Denied    | `bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300`             |
| Any other | `bg-background-2 text-foreground`                                          |

These are Tailwind palette steps, not Preline tokens, because the token set has no success or warning role. They are used only for status badges.

## Data tables

Staff screens show records in plain tables:

- A sortable column's header is a button carrying `aria-sort`; clicking it again reverses the order. Amounts sort numerically.
- Only an editable cell renders a control (a select), and every other cell is text.
- Row selection is a leading checkbox column.
- A read-only table renders no controls at all.
- A table with no rows keeps its header and shows no body rows.

## Dialogs

A decision that interrupts the page is a modal built on `@headlessui/react` `Dialog`:

- It has a title and one line of copy, and focus is trapped and returned on close.
- A confirmation offers Cancel and one action button whose label names the consequence ("Discard and refresh"), never "OK".
- A blocking error dialog ("Fatal Error!") shows the message and no action that continues the session.

The browser's own `confirm`/`alert` are never used.

## Charts

Charts are inline SVG with `role="img"` and an `aria-label` that states the chart title. Series colours come from the `chart-*` tokens in order. Every chart has a legend or table beside it that gives each value in text, so a reader never needs the colour to read the chart.

## State frames

Pages never hand-roll "nothing here", "something went wrong" or "loading" markup. They use the shared frames in `src/components/state/`:

- **Empty** — icon, one short title, optional one line of copy and one action.
- **Error** — says the page could not be loaded; offers **Try again** when the failure is retryable and always a link back home. Not-found uses the same frame without Try again.
- **Loading** — a skeleton holding the content area's shape (DESIGN-GUIDE §10.6).

A page that fetches wraps its content in `AsyncContent`, which chooses between the three.

A page whose whole job is to report a failed action (a rejected sign-in, a refused request) uses the Error frame too, with a link back to the form instead of **Try again**.

## Forms

Text fields use the one input primitive in `src/components/ui/`; forms do not style raw `<input>` elements.

- **Labels are always visible** above the field. A placeholder is an example, never the label. Helper text sits under the field in `text-muted-foreground-1`.
- **Required fields are checked before submit.** When a required field is empty the form does not submit and shows one message per empty field, naming it ("Password is empty."). The messages sit in one live region (`role="alert"`), and the first empty field receives focus. The server applies the same rules again and never trusts the check.
- **Server rejections** that concern the whole form rather than one field go to a result page in the Error frame (see State frames).
- **Credential forms** never pre-fill a password and never pre-fill demo or staff credentials. A remembered user name is the only value a sign-in form may fill in.
- **Two forms on one page**, such as returning customer and new account, sit side by side from `md` up and stack below it. Each form has its own heading and submit button.

## Components

Pattern (see `src/components/ui/button.tsx` + `button-variants.ts`):

- Variants via `class-variance-authority`
- Class merging via `cn()` (`clsx` + `tailwind-merge`) — always last, so callers can override
- Polymorphism via Radix `Slot` (`asChild` prop)
- Variants exported from a separate `*-variants.ts` file, not the component file (avoids an `eslint-plugin-react-refresh` warning)

Shared primitives (button, input) go in `src/components/ui/`, shell pieces in `src/components/layout/`, state frames in `src/components/state/`. Each follows this pattern and gets a `*.test.tsx`.

## Icons

`lucide-react` for general use, `@heroicons/react` for `@headlessui/react` overlays (the navigation panel).

## Animation

`tw-animate-css` — Tailwind v4-compatible successor to `tailwindcss-animate`. Nothing animates on page load (DESIGN-GUIDE §2.8).
