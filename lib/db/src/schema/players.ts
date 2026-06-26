import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  minecraftUsername: text("minecraft_username").notNull().unique(),
  uuid: text("uuid"),
  discord: text("discord"),
  country: text("country"),
  countryCode: text("country_code"),
  skinUrl: text("skin_url"),
  points: integer("points").notNull().default(0),
  overallTier: text("overall_tier"),
  socialLinks: text("social_links"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
