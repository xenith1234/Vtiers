import { pgTable, serial, timestamp, integer, real, unique } from "drizzle-orm/pg-core";
import { text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { playersTable } from "./players";
import { gamemodesTable } from "./gamemodes";

export const rankingsTable = pgTable("rankings", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  gamemodeId: integer("gamemode_id").notNull().references(() => gamemodesTable.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("UR"),
  points: integer("points").notNull().default(0),
  winRate: real("win_rate").notNull().default(0),
  matches: integer("matches").notNull().default(0),
  kills: integer("kills").notNull().default(0),
  deaths: integer("deaths").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  playerGamemodeUnique: unique().on(table.playerId, table.gamemodeId),
}));

export const insertRankingSchema = createInsertSchema(rankingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRanking = z.infer<typeof insertRankingSchema>;
export type Ranking = typeof rankingsTable.$inferSelect;
