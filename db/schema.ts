import { sql } from "drizzle-orm";
import {
  check,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Sign-on (design.md P1): the credential table. `users` was the boilerplate
// id/name/email example; it now holds only the sign-on identity, keyed by
// the user-chosen id, and every foreign key onto it is that text id
// (SWHR-R-0068 — storefront and staff principals share this one table).
export const users = sqliteTable("users", {
  userId: text("userId").primaryKey(),
  passwordHash: text("passwordHash").notNull(),
});

export const profiles = sqliteTable("profiles", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.userId),
  preferredLanguage: text("preferredLanguage").notNull().default("en_US"),
});

// Catalog (design D4, P4; target shape architecture/schema.sql). Every
// `*Details` table is keyed (entityId, locale) with no unique-per-entity
// constraint on the base table's own columns beyond its id — a row missing
// in a locale means the entity does not exist in that locale; queries never
// fall back (SWHR-R-0014). Prices are integer minor units (SD-8).
export const category = sqliteTable(
  "category",
  {
    id: text("id").primaryKey(),
  },
  (table) => [check("category_id_length_check", sql`length(${table.id}) <= 10`)],
);

export const categoryDetails = sqliteTable(
  "categoryDetails",
  {
    categoryId: text("categoryId")
      .notNull()
      .references(() => category.id),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    image: text("image"),
    description: text("description"),
  },
  (table) => [
    primaryKey({ columns: [table.categoryId, table.locale] }),
    check("categoryDetails_name_length_check", sql`length(${table.name}) <= 80`),
    check(
      "categoryDetails_image_length_check",
      sql`${table.image} IS NULL OR length(${table.image}) <= 255`,
    ),
    check(
      "categoryDetails_description_length_check",
      sql`${table.description} IS NULL OR length(${table.description}) <= 255`,
    ),
  ],
);

export const product = sqliteTable(
  "product",
  {
    id: text("id").primaryKey(),
    categoryId: text("categoryId")
      .notNull()
      .references(() => category.id),
  },
  (table) => [check("product_id_length_check", sql`length(${table.id}) <= 10`)],
);

export const productDetails = sqliteTable(
  "productDetails",
  {
    productId: text("productId")
      .notNull()
      .references(() => product.id),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    image: text("image"),
    description: text("description"),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.locale] }),
    check("productDetails_name_length_check", sql`length(${table.name}) <= 80`),
  ],
);

export const item = sqliteTable(
  "item",
  {
    id: text("id").primaryKey(),
    productId: text("productId")
      .notNull()
      .references(() => product.id),
  },
  (table) => [check("item_id_length_check", sql`length(${table.id}) <= 10`)],
);

export const itemDetails = sqliteTable(
  "itemDetails",
  {
    itemId: text("itemId")
      .notNull()
      .references(() => item.id),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    image: text("image").notNull(),
    // Integer minor units (SD-8): cents for USD/CNY, whole yen for JPY —
    // see lib/locale/money.ts, the one place that knows the divisor.
    listPrice: integer("listPrice").notNull(),
    unitCost: integer("unitCost").notNull(),
    // Five optional free-text attributes (SD2) — e.g. color, size — shown
    // alongside the product name in the item's display title.
    attr1: text("attr1"),
    attr2: text("attr2"),
    attr3: text("attr3"),
    attr4: text("attr4"),
    attr5: text("attr5"),
  },
  (table) => [
    primaryKey({ columns: [table.itemId, table.locale] }),
    check("itemDetails_name_length_check", sql`length(${table.name}) <= 80`),
    check("itemDetails_description_length_check", sql`length(${table.description}) <= 255`),
    check(
      "itemDetails_attr1_length_check",
      sql`${table.attr1} IS NULL OR length(${table.attr1}) <= 80`,
    ),
    check(
      "itemDetails_attr2_length_check",
      sql`${table.attr2} IS NULL OR length(${table.attr2}) <= 80`,
    ),
    check(
      "itemDetails_attr3_length_check",
      sql`${table.attr3} IS NULL OR length(${table.attr3}) <= 80`,
    ),
    check(
      "itemDetails_attr4_length_check",
      sql`${table.attr4} IS NULL OR length(${table.attr4}) <= 80`,
    ),
    check(
      "itemDetails_attr5_length_check",
      sql`${table.attr5} IS NULL OR length(${table.attr5}) <= 80`,
    ),
  ],
);

// Sign-on (design.md P4): one server-side session row per realm, keyed by a
// random id carried in the sealed locale cookie (lib/auth/session.ts,
// SWHR-T-0044). A row idle past IDLE_TIMEOUT_MS[realm] is deleted with its
// cart lines rather than read; each realm is independent, so there is no
// single sign-on across storefront/admin/supplier.
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    realm: text("realm").notNull(),
    userId: text("userId").references(() => users.userId),
    signedOn: integer("signedOn", { mode: "boolean" }).notNull().default(false),
    originalUrl: text("originalUrl"),
    lastSeenAt: integer("lastSeenAt", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check("sessions_realm_check", sql`${table.realm} IN ('storefront', 'admin', 'supplier')`),
  ],
);

// Sign-on (design.md P8): registration step 2 creates this row and a
// `profiles` row in one transaction (SWHR-T-0045). customer-account
// (swhr-i-0007) extends it and must not recreate it.
export const customers = sqliteTable("customers", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.userId),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});

// Sign-on (design.md P9): the anonymous-cart seam, in shopping-cart's
// (swhr-i-0008) shape — one line per item per session; ending a storefront
// session deletes its lines. Remove/update/subtotal remain that change's.
export const cartLines = sqliteTable(
  "cartLines",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionId: text("sessionId")
      .notNull()
      .references(() => sessions.id),
    itemId: text("itemId")
      .notNull()
      .references(() => item.id),
    quantity: integer("quantity").notNull().default(1),
    addedAt: integer("addedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("cartLines_session_item_unique").on(table.sessionId, table.itemId)],
);

// Sign-on (design.md P10): staff role grants, mirroring `sun-j2ee-ri.xml`.
// A principal is either a userId (principalType 'user') or a group name
// (principalType 'group', resolved through `groupMembers`). Never read on
// the storefront (SWHR-R-0068) — only the admin/supplier realms consult it.
export const roleAssignments = sqliteTable(
  "roleAssignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    realm: text("realm").notNull(),
    role: text("role").notNull(),
    principalType: text("principalType").notNull(),
    principal: text("principal").notNull(),
  },
  (table) => [
    check("roleAssignments_realm_check", sql`${table.realm} IN ('admin', 'supplier')`),
    check("roleAssignments_principalType_check", sql`${table.principalType} IN ('user', 'group')`),
  ],
);

export const groupMembers = sqliteTable(
  "groupMembers",
  {
    groupName: text("groupName").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => users.userId),
  },
  (table) => [primaryKey({ columns: [table.groupName, table.userId] })],
);

// Messaging (design.md P4): one SQLite outbox for every asynchronous hop.
// Each channel has a fixed subscriber list, so a message gets one delivery
// row per subscriber at enqueue time (lib/messaging/outbox.ts).
export const outboxMessages = sqliteTable("outboxMessages", {
  id: text("id").primaryKey(),
  channel: text("channel").notNull(),
  payload: text("payload").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});

export const outboxDeliveries = sqliteTable(
  "outboxDeliveries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    messageId: text("messageId")
      .notNull()
      .references(() => outboxMessages.id),
    consumer: text("consumer").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("lastError"),
    nextAttemptAt: integer("nextAttemptAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check(
      "outboxDeliveries_status_check",
      sql`${table.status} IN ('pending', 'delivered', 'dead')`,
    ),
  ],
);

// Supplier orders (design.md P5 — built here in order-fulfillment D1's
// shape; that change extends these tables and must not recreate them).
// `orderId` is the partner order id, the natural key shared with the
// order centre. Money is integer minor units (cents), converted exactly
// from the document's decimal string at persistence time (P2).
export const supplierOrders = sqliteTable(
  "supplierOrders",
  {
    orderId: text("orderId").primaryKey(),
    orderDate: integer("orderDate", { mode: "timestamp_ms" }).notNull(),
    status: text("status").notNull().default("PENDING"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check(
      "supplierOrders_status_check",
      sql`${table.status} IN ('PENDING', 'APPROVED', 'DENIED', 'COMPLETED')`,
    ),
  ],
);

export const supplierContacts = sqliteTable("supplierContacts", {
  orderId: text("orderId")
    .primaryKey()
    .references(() => supplierOrders.orderId),
  familyName: text("familyName").notNull(),
  givenName: text("givenName").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
});

export const supplierAddresses = sqliteTable("supplierAddresses", {
  orderId: text("orderId")
    .primaryKey()
    .references(() => supplierOrders.orderId),
  streetName1: text("streetName1").notNull(),
  streetName2: text("streetName2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zipCode").notNull(),
  country: text("country").notNull(),
});

export const supplierLineItems = sqliteTable("supplierLineItems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("orderId")
    .notNull()
    .references(() => supplierOrders.orderId),
  categoryId: text("categoryId").notNull(),
  productId: text("productId").notNull(),
  itemId: text("itemId").notNull(),
  lineNum: integer("lineNum").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unitPrice").notNull(),
  quantityShipped: integer("quantityShipped").notNull().default(0),
});
