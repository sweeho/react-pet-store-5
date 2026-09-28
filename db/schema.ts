import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
