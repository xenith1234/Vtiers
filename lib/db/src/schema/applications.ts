import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationStatusEnum = pgEnum("application_status", ["pending", "approved", "rejected", "in_review"]);

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  minecraftUsername: text("minecraft_username").notNull(),
  discord: text("discord").notNull(),
  gamemodes: text("gamemodes").notNull(),
  evidence: text("evidence").notNull(),
  notes: text("notes"),
  status: applicationStatusEnum("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by"),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true, createdAt: true, updatedAt: true, status: true, reviewedBy: true, reviewNotes: true, reviewedAt: true
});
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
