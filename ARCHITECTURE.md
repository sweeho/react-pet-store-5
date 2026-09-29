# Architecture

See [PRODUCT.md](./PRODUCT.md) for what this is, [DESIGN.md](./DESIGN.md) for the visual system.

## Stack

- **Framework**: Vite 8 running a React 19 SPA + a Nitro 3 server together
- **Language**: TypeScript 5 (strict)
- **Frontend routing**: `vite-plugin-pages` (file-based) + `react-router` 8
- **Backend routing**: Nitro 3 / H3 2 (file-based)
- **Database**: SQLite via Bun's built-in `bun:sqlite` + Drizzle ORM — schema/client in `db/`, migrations in `drizzle/`. Requires the Bun runtime (dev, test, and production — see Deployment below)
- **Styling**: Tailwind CSS v4 (CSS-first, no `tailwind.config.ts`) + `tw-animate-css`; Preline tokens — see [DESIGN.md](./DESIGN.md#tokens)
- **UI primitives**: shadcn/ui-style — Radix Slot, `class-variance-authority`, `cn()`
- **Icons**: `lucide-react`, `@heroicons/react`
- **Auto-imports**: `unplugin-auto-import` — `react` + `react-router` need no import
- **Fonts**: `unplugin-fonts` (config in `configs/fonts.config.ts`)
- **XML**: `@xmldom/xmldom` (parse, build, serialize) + `xmllint-wasm` (XSD validation, async) — partner documents only, see [Partner documents and messaging](#partner-documents-and-messaging)
- **Tests**: Vitest + Testing Library (unit/integration/UI), Playwright (E2E/smoke)
- **Lint/format**: ESLint 9 + typescript-eslint, Prettier, Husky + lint-staged

## Directory structure

```
.
├── src/
│   ├── i18n/            # Locale provider, per-screen per-locale definitions (screens/*.ts), admin string catalogues
│   ├── components/ui/   # shadcn/ui-style primitives (+ *.test.tsx)
│   ├── components/layout/ # the site shell: header, Global navigation, footer
│   ├── components/state/  # shared empty / error / loading frames, AsyncContent
│   ├── pages/            # Frontend routes, file-based (+ *.test.tsx)
│   ├── constants/navigation.ts # the one list of primary areas and pet categories
│   ├── hooks/, utils/, types/, constants/, data/, store/
│   ├── test/              # Vitest setup
│   ├── index.css           # Tailwind v4 + design tokens
│   └── main.tsx
├── routes/api/            # Backend routes, file-based (+ *.test.ts)
├── lib/                    # Server and shared modules (locale model, session, catalog queries, e-mail) — not auto-registered by Nitro
│   ├── auth/               # Credentials, per-realm sessions, the protected-page gate, roles
│   ├── cart/               # Session cart lines
│   ├── b2b/                # Partner XML documents: xml/ infrastructure, elements/, documents/, partner/, exchange/, schemas/ (bundled DTD/XSD + catalog)
│   └── messaging/          # The one outbox and dispatcher every asynchronous hop uses
├── middleware/             # Runs before every route handler
├── plugins/                # Nitro server plugins (the outbox dispatcher poller)
├── db/                      # Drizzle schema.ts + client.ts (sqlite connection, migrate, seed)
├── drizzle/                  # Generated SQL migrations (drizzle-kit generate), committed
├── e2e/                     # Playwright specs + global-setup.ts
├── configs/                 # Fonts; signon-config.json (sign-on page, error page, protected pages)
├── scripts/
├── server.ts                # Nitro server entry
├── vite.config.ts, vitest.config.ts, playwright.config.ts, drizzle.config.ts
├── tsconfig.json             # src
├── tsconfig.node.json          # server/config/test files
└── package.json
```

## Routing

**Frontend**: `src/pages/**/*.tsx` → routes (`about.tsx` → `/about`, `[id].tsx` → `/:id`, `[...all].tsx` → catch-all). `*.test.tsx` excluded via `Pages({ exclude })` in `vite.config.ts`.

**Site shell**: `src/main.tsx` mounts every routed page inside one layout (header, the `Global` navigation, `main`, footer) with a shared loading fallback and error boundary. Pages render content only. Primary-area routes are `/category/:categoryId`, `/search`, `/cart`, `/checkout`, `/account`, `/signin`, `/admin`, `/supplier`, listed once in `src/constants/navigation.ts`; an area whose capability has not shipped is a placeholder page until it does.

**Backend**: `routes/api/*.ts` → `/api/*`, `middleware/*.ts` runs first and can set `event.context`. Shared and server-only modules live in `lib/` (in `tsconfig.node.json`; `lib/**/*.test.ts` run in the Vitest `server` project) and are imported explicitly. Requires `nitro({ serverDir: "./" })` in `vite.config.ts` — default is `false` (no scanning). `*.test.ts` excluded via `nitro({ ignore })`.

## Data flow example

`GET /api/hello`: `middleware/auth.ts` (a boilerplate example that authenticates nothing) sets `event.context.user` → `routes/api/hello.ts` reads it and responds. `routes/api/catalog/products/[productId].ts` shows the dynamic-route + `createError()` 404 pattern, backed by a real query against `db/client.ts`'s Drizzle instance.

## Locale

The storefront runs in `en_US`, `ja_JP` or `zh_CN`; the default is deployment configuration (`DEFAULT_LOCALE`, `en_US`). Spec: `openspec/specs/localization/` once change `swhr-i-0003-localization` archives.

- **Model.** `lib/locale/model.ts` is the only list of supported locales and the only `language_COUNTRY` parser. Server and SPA both import it.
- **Session.** `middleware/locale.ts` loads the sealed-cookie session (`SESSION_PASSWORD`), assigns the default when absent and sets `event.context.locale`. The cookie also holds the cart locale and the ids of the sign-on sessions (see [Sign-on and access](#sign-on-and-access)). The locale is stored nowhere else, so it survives sign-out. The SPA reads the locale from `GET /api/locale` and changes it with `POST /api/locale`; sign-on and profile save apply the customer's preferred language through `lib/locale/preference.ts`.
- **Screens.** Page copy lives in `src/i18n/screens/<screen>.ts`, one map per locale, found by an `import.meta.glob` registry. A missing locale or screen falls back to `en_US`; a screen defined nowhere is an error. A `?locale=` query overrides the session for that render only.
- **Data.** Catalog, profile, order and e-mail content are keyed by locale. Prices are per-locale rows in integer minor units, formatted at display time and never converted.

## Sign-on and access

Shoppers sign on only for account, account change, checkout and the sign-on welcome page. Administration and supplier inventory have their own staff sign-in and admit only the `administrator` role. Spec: `openspec/specs/sign-on/` once change `swhr-i-0005-sign-on-and-access-control` archives.

- **Credentials.** `users` holds a user id (at most 25 characters, no `%` or `*`) and a `Bun.password` hash. Storefront and staff principals share it. `lib/auth/credentials.ts` owns the rules, creation and authentication. No code path logs a password.
- **Sessions.** There is one server-side `sessions` row per realm (`storefront`, `admin`, `supplier`), found through ids in the sealed cookie. The realms are independent, so there is no single sign-on. A row idle past its realm's limit (15 minutes storefront, 54 minutes staff) is replaced by a fresh anonymous one. Ending a storefront session also deletes its cart lines. `lib/auth/session.ts` is the only way in.
- **Protected pages.** `configs/signon-config.json` (path overridable by `SIGNON_CONFIG_PATH`) names the sign-on page, the error page and the protected storefront pages by exact path. One function, `checkGate`, decides and records the page to return to. Three callers use it:
  - the SPA's `SignOnGate`, which asks before rendering a protected route
  - `middleware/signon.ts`, for document requests
  - `requireSignOn`, for the API routes behind protected pages
- **Roles.** `role_assignments` grants a role per realm to a user or a group, and `group_members` holds group membership. `requireRole(event, realm, "administrator")` guards staff routes. Staff users are seeded outside production only.

## Partner documents and messaging

The order centre and the supplier exchange XML documents in the legacy trading-partner formats (purchase order, supplier order, invoice). Spec: `openspec/specs/b2b-document-exchange/` once change `swhr-i-0004-partner-document-exchange` archives.

- **Documents.** `lib/b2b/` writes and reads every document format. Schemas are bundled under `lib/b2b/schemas/`, found through an entity catalog; a deployment catalog (`B2B_ENTITY_CATALOG`) overrides the bundled one. Validation is switched per document type and form (`B2B_VALIDATE_*`, `B2B_SCHEMA_FORM`). The order centre publishes its catalog and schemas at `GET /api/b2b/entity-catalog` and `GET /api/b2b/schemas/:file`. There is no XML-over-HTTP intake.
- **Messaging.** Asynchronous hops go through one SQLite outbox (`lib/messaging/`). A producer enqueues inside its own `db.transaction()`. Each channel has a fixed subscriber list and one delivery row per subscriber. A dispatcher, polled by a Nitro plugin, runs each handler's commit and marks it delivered in one transaction, and retries on failure. Channels today: `supplier.purchase-order` (→ supplier intake) and `opc.invoice` (→ order fulfilment, customer notification).

## Database

`db/schema.ts` defines Drizzle tables; `db/client.ts` opens the SQLite connection, runs pending migrations from `drizzle/`, and seeds empty tables (the legacy pet catalog in all three locales from `db/seed/`; staff users outside production). Migrations run through `migrateDatabase` (`lib/db/migrate.ts`): foreign-key enforcement is off while they apply, back on afterwards, and startup fails if `PRAGMA foreign_key_check` then reports a dangling reference. Routes import `db` and the table objects directly (see `routes/api/catalog/`) — no repository layer.

- `bun run db:generate` — after editing `db/schema.ts`, generates a new migration into `drizzle/` (via `drizzle-kit`, config in `drizzle.config.ts`)
- `bun run db:studio` — browse the db in Drizzle Studio
- The db file itself is `sqlite.db` at the project root (gitignored, created on first run). `SQLITE_PATH` points elsewhere, which Playwright uses to get a fresh database per run. `drizzle/` migrations are committed
- Entities: `users` (credentials, keyed by user id); `sessions` (one row per realm session); `role_assignments` and `group_members`; customer accounts: `customers` (one per user id) owning one `profiles` row (preferred language, favourite category, My List and banner preferences) and one `accounts` row (status), which owns one `contact_infos` row (with one `addresses` row) and one `credit_cards` row; ownership is a unique child-side foreign key with cascading delete; `cart_lines` (one per session and item); catalog `category`, `product`, `item`, each with a `*_details` table keyed `(id, locale)` — target shape in [architecture/schema.sql](./architecture/schema.sql). A row missing in a locale means the entity does not exist in that locale; queries never fall back. Supplier orders: `supplier_orders` with `supplier_contacts`, `supplier_addresses` and `supplier_line_items` (money in integer minor units). Messaging: `outbox_messages` and `outbox_deliveries` (one row per message and subscriber).
- Under Vitest (`VITEST=true`), `db/client.ts` swaps in an in-memory db instead, so tests never touch the dev database

## Testing

Four tiers, one worked example each. Commands and how to extend: [README.md](./README.md#testing), [AGENTS.md](./AGENTS.md).

## Deployment

- `ecosystem.config.js` (PM2) runs the real build: `.output/server/index.mjs`, under Bun (`interpreter: "bun"`) — required by `db/client.ts`'s `bun:sqlite` import. `nitro.service` (systemd) is the non-PM2 equivalent, same requirement.
- `Dockerfile`/`docker-compose.yml` build a static `dist/` served by nginx — don't rely on them for the Nitro/DB-backed API without fixing first (they never run `.output/server/index.mjs`)

## Key Decisions

- **One shell, one navigation list.** Every page renders inside the shared layout and draws no chrome of its own; primary areas are added to `src/constants/navigation.ts`, never as a second menu. Keeps eleven capabilities looking like one shop. Authored in change `swhr-i-0002-bootstrap-landing-page-and-s`.
- **Pet categories come from the catalog.** The Pets menu and the home picture map list the categories returned by `GET /api/catalog/categories` for the session locale, in its order; `src/constants/navigation.ts` holds only the non-catalog areas. A category missing in a locale must disappear from navigation too, which a static list cannot do. Authored in change `swhr-i-0006-catalog-browsing-and-search` (design P5).
- **Shared state frames.** Pages show empty, error and loading states only through `src/components/state/` (`AsyncContent` for fetched data). One look and one retry behaviour across capabilities. Authored in change `swhr-i-0002-bootstrap-landing-page-and-s`.
- **Preline is the token source.** `design/tokens.theme.css` feeds `src/index.css`; shadcn names are aliases. The mockups are drawn on it and the only other guide's token files are not in the repository. Authored in change `swhr-i-0002-bootstrap-landing-page-and-s`.
- **One locale model.** Supported locales, the default and identifier parsing come only from `lib/locale/model.ts`; no capability keeps its own list or parser. The legacy system had four diverging copies. Authored in change `swhr-i-0003-localization` (design D1, P1).
- **The server owns the locale.** The session locale is set and read server-side (`event.context.locale`); the SPA never chooses a locale on its own, so pages, cart and business operations agree. Authored in change `swhr-i-0003-localization` (design D2, P2).
- **Locale-keyed data, no fallback.** Localized content and prices are rows keyed by locale, stored as integer minor units; a missing row is "not found", never English. Page copy is the only thing that falls back to `en_US`. Authored in change `swhr-i-0003-localization` (design D3, D4, P3, P4).
- **Foreign keys are enforced.** `db/client.ts` turns on `PRAGMA foreign_keys` for every connection, so each `references()` in `db/schema.ts` is a real constraint and a test fixture must insert parents before children. SQLite leaves it off by default, which made the catalog's rejected-save requirements untestable. Authored in change `swhr-i-0006-catalog-browsing-and-search` (SD3).
- **Migrations run with enforcement off, then are checked.** `migrateDatabase` switches `PRAGMA foreign_keys` off around drizzle's `migrate`, on again after, and throws on any `foreign_key_check` row; a migration never relies on its own `PRAGMA foreign_keys` line. Drizzle runs all pending migrations in one transaction, where SQLite ignores that pragma, so a table rebuild with enforcement on fails on any populated database. Authored in change `swhr-s-0009-bugfix-swhr-t-0087-swhr-t-00` (design D1).
- **One paging shape.** Every paged listing returns `{ items, paging }` with `PageInfo` from `lib/catalog/paging.ts` and takes `start`/`count` query parameters; later listings reuse it rather than inventing another. Authored in change `swhr-i-0006-catalog-browsing-and-search` (design P1).
- **One outbox for every asynchronous hop.** Checkout, approval, fulfilment, supplier inventory and notifications enqueue on `lib/messaging/`, inside the transaction that changes state, and never add a second queue. Delivery is tracked per subscriber. A failed handler retries until `OUTBOX_MAX_ATTEMPTS` (default 10), then its delivery is marked `dead` and kept. This replaces five legacy JMS destinations with one mechanism. Authored in change `swhr-i-0004-partner-document-exchange` (design P4, P5).
- **Sessions are server-side and per realm; access checks live in the caller.** Every capability reads sign-on state through `lib/auth/session.ts` and guards with `checkGate`, `requireSignOn` or `requireRole`. Data-layer functions never check roles or sessions. This gives one revocable session store and one place where access is decided. Authored in change `swhr-i-0005-sign-on-and-access-control` (design P4, P6, P10).
- **Card numbers are kept as their last four digits only.** The card on file stores `cardLastFour`, type and expiry, and is shown masked; no table, log or response carries a full card number, and "the card on the account" at checkout means those three values. PRD constraint 6 forbids storing or showing a card number in full. Authored in change `swhr-i-0007-customer-account-and-profile` (design P3).
- **Protected pages are configuration.** A page becomes protected through an entry in `configs/signon-config.json`, matched by exact path, never through code in the page. The operator can change protection without a release, as the legacy deployment descriptors allowed. Authored in change `swhr-i-0005-sign-on-and-access-control` (design P5, P6).
- **XML is validated against XSD only.** Validation uses `xmllint-wasm`, which cannot validate DTDs under Bun. Each DTD therefore ships with an equivalent XSD, and DTD-form documents are validated against it. A new document type adds both files. Authored in change `swhr-i-0004-partner-document-exchange` (design P1).
