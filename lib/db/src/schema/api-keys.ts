import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const apiKeysTable = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  lastUsed: timestamp("last_used", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
