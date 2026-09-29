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
    lastOrderId: text("lastOrderId"),
    lastOrderEmail: text("lastOrderEmail"),
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

// Customer account (swhr-i-0007 design.md P1, P2): `profiles` extends the
// sign-on row and now hangs off `customers`, so deleting a customer removes
// it. The account graph keeps foreign keys on the child side with unique
// owner columns (one contact, one card per account, one address per
// contact); the owner is nullable so a record can exist before it is
// attached. Every ownership FK cascades.
export const profiles = sqliteTable("profiles", {
  userId: text("userId")
    .primaryKey()
    .references(() => customers.userId, { onDelete: "cascade" }),
  preferredLanguage: text("preferredLanguage").notNull().default("en_US"),
  favoriteCategory: text("favoriteCategory"),
  myListPreference: integer("myListPreference", { mode: "boolean" }).notNull().default(true),
  bannerPreference: integer("bannerPreference", { mode: "boolean" }).notNull().default(true),
});

export const accounts = sqliteTable(
  "accounts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId")
      .notNull()
      .unique()
      .references(() => customers.userId, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
  },
  (table) => [check("accounts_status_check", sql`${table.status} IN ('active', 'disabled')`)],
);

export const contactInfos = sqliteTable("contactInfos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("accountId")
    .unique()
    .references(() => accounts.id, { onDelete: "cascade" }),
  givenName: text("givenName").notNull().default(""),
  familyName: text("familyName").notNull().default(""),
  telephone: text("telephone").notNull().default(""),
  email: text("email").notNull().default(""),
});

export const addresses = sqliteTable("addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactInfoId: integer("contactInfoId")
    .unique()
    .references(() => contactInfos.id, { onDelete: "cascade" }),
  streetName1: text("streetName1").notNull().default(""),
  streetName2: text("streetName2"),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  zipCode: text("zipCode").notNull().default(""),
  country: text("country").notNull().default(""),
});

// P3: the full card number is never stored — only its last four digits.
export const creditCards = sqliteTable("creditCards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("accountId")
    .unique()
    .references(() => accounts.id, { onDelete: "cascade" }),
  cardLastFour: text("cardLastFour").notNull().default(""),
  cardType: text("cardType").notNull().default(""),
  expiryDate: text("expiryDate"),
});

// Shopping cart (swhr-i-0008): one line per item per session, unique on
// (sessionId, itemId); ending a storefront session deletes its lines. Read
// through the CartLine/CartView contract in lib/cart/types.ts.
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

// Checkout (swhr-i-0009 design.md P3): identifier counters and the stored
// purchase-order snapshot. Money is integer minor units; `totalValue` is the
// supplied total, never recomputed from the lines. The contact and address
// are copies, not references to the customer's profile (SWHR-R-0161).
export const counters = sqliteTable(
  "counters",
  {
    name: text("name").primaryKey(),
    value: integer("value").notNull(),
  },
  (table) => [check("counters_name_check", sql`length(${table.name}) <= 255`)],
);

export const purchaseOrders = sqliteTable(
  "purchaseOrders",
  {
    orderId: text("orderId").primaryKey(),
    userId: text("userId").notNull(),
    emailId: text("emailId").notNull(),
    orderDate: integer("orderDate", { mode: "timestamp_ms" }).notNull(),
    locale: text("locale").notNull(),
    totalValue: integer("totalValue").notNull(),
    status: text("status").notNull().default("PENDING"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check(
      "purchaseOrders_status_check",
      sql`${table.status} IN ('PENDING', 'APPROVED', 'DENIED', 'SHIPPED_PART', 'COMPLETED')`,
    ),
  ],
);

export const orderContacts = sqliteTable("orderContacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("orderId")
    .notNull()
    .unique()
    .references(() => purchaseOrders.orderId, { onDelete: "cascade" }),
  givenName: text("givenName").notNull(),
  familyName: text("familyName").notNull(),
  telephone: text("telephone").notNull(),
  email: text("email"),
});

export const orderAddresses = sqliteTable("orderAddresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contactId")
    .notNull()
    .unique()
    .references(() => orderContacts.id, { onDelete: "cascade" }),
  streetName1: text("streetName1").notNull(),
  streetName2: text("streetName2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zipCode").notNull(),
  country: text("country").notNull(),
});

export const orderCards = sqliteTable("orderCards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("orderId")
    .notNull()
    .unique()
    .references(() => purchaseOrders.orderId, { onDelete: "cascade" }),
  cardNumber: text("cardNumber").notNull(),
  cardType: text("cardType").notNull(),
  expiryDate: text("expiryDate").notNull(),
});

export const orderLines = sqliteTable(
  "orderLines",
  {
    orderId: text("orderId")
      .notNull()
      .references(() => purchaseOrders.orderId, { onDelete: "cascade" }),
    lineNum: integer("lineNum").notNull(),
    categoryId: text("categoryId").notNull(),
    productId: text("productId").notNull(),
    itemId: text("itemId").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unitPrice").notNull(),
  },
  (table) => [primaryKey({ columns: [table.orderId, table.lineNum] })],
);
