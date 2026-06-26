import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gamemodesTable = pgTable("gamemodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon"),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGamemodeSchema = createInsertSchema(gamemodesTable).omit({ id: true, createdAt: true });
export type InsertGamemode = z.infer<typeof insertGamemodeSchema>;
export type Gamemode = typeof gamemodesTable.$inferSelect;
