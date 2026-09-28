import { sql } from "drizzle-orm";
import { check, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

export const profiles = sqliteTable("profiles", {
  userId: integer("userId")
    .primaryKey()
    .references(() => users.id),
  preferredLanguage: text("preferredLanguage").notNull().default("en_US"),
});

// Catalog (design D4, P4; target shape architecture/schema.sql). Every
// `*Details` table is keyed (entityId, locale) with no unique-per-entity
// constraint on the base table's own columns beyond its id — a row missing
// in a locale means the entity does not exist in that locale; queries never
// fall back (SWHR-R-0014). Prices are integer minor units (SD-8).
export const category = sqliteTable("category", {
  id: text("id").primaryKey(),
});

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
  (table) => [primaryKey({ columns: [table.categoryId, table.locale] })],
);

export const product = sqliteTable("product", {
  id: text("id").primaryKey(),
  categoryId: text("categoryId")
    .notNull()
    .references(() => category.id),
});

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
  (table) => [primaryKey({ columns: [table.productId, table.locale] })],
);

export const item = sqliteTable("item", {
  id: text("id").primaryKey(),
  productId: text("productId")
    .notNull()
    .references(() => product.id),
});

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
  },
  (table) => [primaryKey({ columns: [table.itemId, table.locale] })],
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
