<!-- Published by Vortex from the project's Design Reference, version 2. Edit it in the Design Workbench. -->

# Meridian Web Design Guide

**Version 1.0.0 · Normative · Audience: autonomous build agents and the humans reviewing them**

This document is the design authority for every web application we ship. An agent that follows it produces
interfaces that are indistinguishable in look and behaviour from every other surface we own, without asking a
designer anything.

Keywords **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT** and **MAY** are used as in RFC 2119. A **MUST**
is a build failure, not a preference.

---

## 1. How to read this document

Work top-down. Sections 2–4 are the contract; sections 5–10 are how to apply it; section 11 is the gate you
check yourself against before declaring a task done.

If this guide and a ticket disagree, the ticket wins on **what** to build and this guide wins on **how it
looks and behaves**. If this guide and the token files disagree, the token files win — they are generated,
this document is written.

**When the guide has no answer**, do not invent one. Follow section 12.

---

## 2. Non-negotiables

These nine rules are checked mechanically. Violating any one of them fails review regardless of how good the
result looks.

1. **No literal design values in product code.** No hex colours, no `px` font sizes, no `px` spacing, no
   `ms` durations, no `cubic-bezier`. Every one MUST be a token reference. The only exceptions are `0`,
   `100%`, `1px` hairlines already tokenised, and values inside the generated token files themselves.
2. **No new tokens invented at the component level.** If the value you need is not in `tokens.json`, section 12
   applies.
3. **Touch targets MUST be at least 44×44 CSS pixels.** A visually smaller control is padded out to 44px with
   a transparent hit area.
4. **Every interactive element MUST be a real interactive element.** `<button>`, `<a href>`, `<input>`,
   `<select>`. A `div` with a click handler is a build failure — keyboard users cannot reach it.
5. **Every interactive element MUST have a visible focus state**, and it MUST be the system focus ring. Do not
   write a second focus treatment and never set `outline: none` without an immediate replacement.
6. **Body text MUST meet WCAG 2.2 AA**: 4.5:1 contrast under 24px, 3:1 at 24px and above. `label-tertiary` and
   `label-quaternary` are below this floor by design and MUST NOT carry readable prose.
7. **Colour MUST NOT be the only carrier of meaning.** A red border needs a message; a green dot needs a word.
8. **Nothing animates on page load.** Motion answers a user action or it does not happen.
9. **Both appearances ship together.** A feature that only works in light mode is unfinished.

---

## 3. The token contract

Four generated files. Treat them as read-only build inputs; edit `build_tokens.py` and regenerate.

| File | Format | Consumed by |
| --- | --- | --- |
| `tokens.json` | DTCG (Design Tokens Community Group) | Style Dictionary, Figma sync, native platforms, codegen |
| `tokens.css` | CSS custom properties, `--ds-*` | Any web app, with or without a framework |
| `theme.tailwind.css` | Tailwind v4 `@theme` | Tailwind projects, maps namespaces onto `--ds-*` |
| `reference.html` / `.svg` / `.png` | Rendered reference sheet | Visual regression baseline, design review, docs |

### 3.1 Naming

Every token is `--ds-<namespace>-<name>`. Namespaces are fixed:

```
color-      font-       font-weight-   text-       leading-
tracking-   weight-     spacing-       radius-     border-
shadow-     duration-   ease-          control-    breakpoint-   layer-
```

The `--ds-` prefix exists so the Tailwind theme can map its own namespaces onto ours without a circular
self-reference. In a Tailwind project you write the utility (`bg-accent`); in plain CSS you write the variable
(`var(--ds-color-accent)`). Both resolve to the same value.

### 3.2 Setup

Plain CSS:

```html
<link rel="stylesheet" href="tokens.css">
```

Tailwind v4:

```css
@import "tailwindcss";
@import "./tokens.css";          /* defines --ds-* */
@import "./theme.tailwind.css";  /* maps them to utilities */
```

The Tailwind theme resets the stock scales (`--color-*: initial` and friends). This is deliberate: `bg-slate-400`
now fails to compile instead of silently shipping an off-system colour. Do not re-enable them.

### 3.3 Two layers of colour

- **Palette** (`--ds-color-blue`, `--ds-color-gray4`) is the raw ramp. It is for building new semantic roles.
  Product code MUST NOT reference it directly.
- **Semantic roles** (`--ds-color-accent`, `--ds-color-label-secondary`) name a job. Product code MUST use
  these. They flip with the appearance on their own, which is why no component needs a dark-mode variant.

---

## 4. Appearance (light and dark)

Light by default. Dark when the operating system asks. Either can be forced with `data-appearance="light"`
or `data-appearance="dark"` on any ancestor, which is how the appearance switcher works.

You MUST NOT write `dark:` variants or `prefers-color-scheme` queries in product code. If you find yourself
needing one, the colour you are using is a palette value where it should be a semantic role.

Translucent roles (`label-secondary`, all four `fill-*`, `separator-default`) carry alpha so they tint correctly
over whatever sits behind them. Never flatten one to a solid hex.

---

## 5. Colour

### 5.1 Roles and their jobs

| Role | Use for | Never for |
| --- | --- | --- |
| `accent` | The single primary action on a screen, selection, focus ring | Decoration, body text |
| `success` | Completed, online, passing | "Go" buttons — the action is primary, not green |
| `warning` | Needs attention, nothing broken yet | Errors |
| `danger` | Destructive actions and failures | Emphasis |
| `info` | Neutral system notice | Anything the user must act on |

### 5.2 Labels

`label-primary` for content. `label-secondary` for supporting copy. `label-tertiary` for placeholders and
disabled state only. `label-quaternary` for watermarks — never readable text.

Two levels of label in one block is the maximum. A third means the hierarchy is wrong.

### 5.3 Backgrounds

Three surfaces, used as a set:

- `bg-primary` — the page.
- `bg-secondary` — recessed areas and the backdrop behind grouped lists.
- `bg-tertiary` — cards and rows raised off `bg-secondary`.

The common pattern is a `bg-secondary` page with `bg-tertiary` cards. Do not stack more than two surface levels;
past that, use elevation instead.

### 5.4 Fills

`fill-*` are for shapes, not surfaces. `fill-tertiary` is the input-field and segmented-control background.
`fill-quaternary` is the hover wash on an otherwise bare row. Fills MUST NOT be used as a card background.

---

## 6. Typography

One family: `--ds-font-sans`, which asks the operating system for its own UI face. We do not ship a webfont for
interface text — it costs a round trip and loses the platform's optical sizing. `--ds-font-mono` is for code,
identifiers and figures that must align in a column. `--ds-font-serif` is for long-form editorial only and
needs a reason.

### 6.1 The scale is eleven bundles

A style carries its size, line height, tracking **and** weight together. You MUST apply the whole style. Setting
`font-size` alone is a build failure.

```css
/* correct */
.card-title { font: var(--ds-weight-title-3) var(--ds-text-title-3)/var(--ds-leading-title-3) var(--ds-font-sans); }
/* Tailwind: text-title-3 applies all four */
```

| Style | Job |
| --- | --- |
| `large-title` | One per page, at the top. Never inside a card. |
| `title-1` / `title-2` | Section and subsection openers. |
| `title-3` | Card and panel headings. |
| `headline` | The important line in a row or card. |
| `body` | Default reading size. Prose MUST NOT go smaller. |
| `callout` | Body copy in a dense region. |
| `subheadline` | Secondary line under a headline. |
| `footnote` | Timestamps, helper text under a field. |
| `caption-1` | Table headers, chart axis labels. |
| `caption-2` | Smallest permitted. Legal and metadata only. |

### 6.2 Rules

- Measure: 45–75 characters. Set `max-width` in `ch`, not `px`.
- Sentence case everywhere — headings, buttons, labels, menu items. Title Case and ALL CAPS are both out.
- Do not use all-caps tracked-out eyebrow labels above headings. If the heading needs an explanation, write a
  sentence under it.
- Never centre more than three lines of text.
- Numbers in a column that will be compared MUST use `--ds-font-mono` or `font-variant-numeric: tabular-nums`.

---

## 7. Space and layout

The grid is 4pt. Use the named step (`--ds-spacing-4`), never the pixel value it resolves to.

### 7.1 Spacing intent

| Steps | Use |
| --- | --- |
| `0-5`–`1-5` | Inside a control: gap between an icon and its label |
| `2`–`3` | Between tightly related elements: label and its field |
| `4`–`5` | Padding inside cards and rows |
| `6`–`8` | Between components |
| `10`–`16` | Between sections |
| `20`–`24` | Page margins on large screens |

Spacing between two elements is owned by their **parent**, set with `gap`. Components MUST NOT carry outer
margins — a component that spaces itself cannot be reused.

### 7.2 Page structure

Content column maxes out at 960px for reading layouts, 1280px for dense application layouts. Centre the column;
do not stretch text to the viewport.

### 7.3 Breakpoints

`sm` 480 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536.

Build the narrow layout first and add breakpoints upward. Most layouts need one breakpoint, not five. A layout
that needs four is usually two layouts wearing a trenchcoat — split the component instead.

---

## 8. Shape and elevation

### 8.1 Radius

Radius encodes size. Nesting rule: **the outer shape is always the rounder one.** A 12px control inside a 16px
card is right; the reverse reads as a mistake.

| Token | Applies to |
| --- | --- |
| `xs`–`sm` | Badges, tags, small inline chips |
| `md`–`lg` | Inputs, segmented controls, small buttons |
| `xl` | Standard buttons, notices |
| `2xl`–`3xl` | Cards, grouped lists, popovers |
| `4xl` | Modal sheets, full-width containers |
| `full` | Pills, avatars, switches |

### 8.2 Elevation

Five levels, each tied to a behaviour:

| Token | Behaviour |
| --- | --- |
| `shadow-0` | Flat on its parent |
| `shadow-1` | Resting card |
| `shadow-2` | Raised card, sticky header |
| `shadow-3` | Popover, dropdown menu |
| `shadow-4` | Modal sheet |

Shadows communicate stacking, not decoration. Two surfaces at the same level are peers and neither casts a
shadow over the other. Separation between peers is a hairline (`--ds-border-hairline` with
`--ds-color-separator-default`), not a shadow.

---

## 9. Motion

Motion answers an action and shows what changed. Its job is orientation, never delight.

| Duration | Use |
| --- | --- |
| `instant` | State flips with no travel: checkbox, switch |
| `fast` | Hover and press feedback, tooltips |
| `base` | Panels, popovers, anything that opens |
| `slow` | Full-screen transitions |
| `deliberate` | Onboarding only, and it needs a reason |

Easing: `default` for almost everything. `out` for something entering, `in` for something leaving, `in-out` for
something moving between two on-screen positions. `spring` is for direct manipulation only — a drag settling,
a sheet snapping.

Animate `transform` and `opacity`. Animating layout properties (`width`, `height`, `top`, `margin`) is a
performance failure.

`prefers-reduced-motion` is handled centrally: every duration token collapses to 1ms. Because of this, components
MUST NOT implement their own reduced-motion branch. They MUST still avoid motion that conveys information no
other way.

---

## 10. Components

### 10.1 Required states

Every interactive component ships all seven. A component missing any one is unfinished.

`default` · `hover` · `focus-visible` · `active` · `disabled` · `loading` (if it can wait) · `error` (if it can fail)

### 10.2 Buttons

One primary action per screen, filled with `accent`. Everything else steps down.

| Variant | Background | Label | Use |
| --- | --- | --- | --- |
| Filled | `accent` | white | The one primary action |
| Tinted | `accent` at 14% | `accent` | Secondary actions |
| Gray | `fill-tertiary` | `label-primary` | Cancel, dismiss |
| Plain | none | `accent` | Tertiary, inline |
| Destructive | `danger` | white | Deletes and irreversible actions |

Height `--ds-control-lg` (44px), radius `xl`, `headline` type. Label states what happens: "Save changes", not
"Submit". The label MUST NOT change tense on press. Destructive actions MUST require confirmation.

Never place two filled buttons side by side.

### 10.3 Fields

Background `fill-tertiary`, no border at rest, radius `lg`, height `--ds-control-lg`, `body` type.
Label above in `footnote`/`label-secondary`. Helper text below in the same style.

Placeholder text is `label-tertiary` and MUST NOT be the only label — it disappears on typing.

Errors: `border-thick` inset in `danger`, helper text turns `danger`, `aria-invalid="true"`. The message says
what to do — "Add the part after the @ to finish this address", not "Invalid email".

Validate on blur, never on keystroke. Clear the error as soon as it is fixed.

### 10.4 Grouped lists

Our workhorse layout. A `bg-tertiary` container, radius `2xl`, `shadow-1`, rows separated by hairlines, with
the last row's separator removed. Row min-height is 44px. Padding is `spacing-3` vertical, `spacing-4`
horizontal. Leading content grows; trailing content stays fixed.

Prefer a grouped list to a grid of cards. Cards are for genuinely parallel objects with images; lists are for
settings, properties and records.

### 10.5 Selection controls

Switch for an immediate on/off setting that applies as soon as it is flipped — no Save button. Checkbox for
selection within a form that is submitted. If a switch sits above a Save button, it should be a checkbox.

### 10.6 Empty, loading and error states

- **Empty** is an invitation: one line of what goes here, one button to create the first one. Never a shrug.
- **Loading** holds the final layout's shape. Use a skeleton for content, a spinner only for actions under 1s.
  Layout MUST NOT shift when content arrives.
- **Error** says what happened, why if known, and the one action that fixes it. No apologies, no "something went
  wrong" on its own.

---

## 11. Definition of done

An agent MUST verify all of these before marking a UI task complete.

**Tokens**
- [ ] No hex, `px` type size, `px` spacing, or raw duration in the diff
- [ ] No palette colours referenced directly; semantic roles only
- [ ] No `dark:` variants or `prefers-color-scheme` queries in product code

**Type and layout**
- [ ] Every text element uses a complete type style, not a bare size
- [ ] Prose measure is 45–75ch
- [ ] Spacing comes from the parent's `gap`; no outer margins on components
- [ ] Sentence case throughout

**Interaction**
- [ ] Every control is a real interactive element
- [ ] All seven states present on every interactive component
- [ ] Tab order is logical, focus ring visible on every stop
- [ ] Touch targets ≥ 44×44

**Accessibility**
- [ ] Body text passes 4.5:1 (3:1 at 24px+) in **both** appearances
- [ ] No meaning carried by colour alone
- [ ] Icon-only buttons have `aria-label`
- [ ] One `<h1>`, heading levels not skipped
- [ ] Form controls have associated `<label>` elements
- [ ] Keyboard-only pass completes every primary flow

**Appearance and motion**
- [ ] Checked in light and dark
- [ ] Nothing animates on load
- [ ] Only `transform` and `opacity` animate
- [ ] Checked at 480px and 1280px

---

## 12. When the system has no answer

You will hit cases this guide does not cover. In order:

1. **Look for a near neighbour.** A component solving a similar problem almost always exists. Match it.
2. **Compose from primitives.** Most gaps are a new arrangement of existing tokens, not a missing token.
3. **If a genuinely new token is needed**, do not add it in the component. Open a proposal against
   `build_tokens.py` stating the value, the role name, both appearance values, and the two other places it
   would be used. A token used once is not a token.
4. **If blocked, stop and ask**, with the specific decision needed and the options you see. A wrong guess
   propagates through every generated screen; a question costs one round trip.

Never fork the system locally. A component-scoped override becomes permanent within a week.

---

## 13. Provenance and versioning

Structure and conventions follow Apple's published Human Interface Guidelines: the platform type scale, the 4pt
grid, semantic label and fill roles, the system colour ramp, and the 44px touch target. This gives us an
interface vocabulary our users already know.

**No Apple fonts, icons or other proprietary assets ship with this system.** `--ds-font-sans` asks the operating
system for its own UI face and falls back cleanly on every platform. Icons are ours or open-licensed. Before
shipping externally, confirm the icon set's licence.

Tokens are versioned with the system. The current version is **1.0.0**, recorded in `tokens.json` under
`$description`.

- **Patch** — a value changes with no name change.
- **Minor** — a token is added.
- **Major** — a token is renamed or removed. Ships with a codemod.
