import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
