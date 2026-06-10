import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const screeningSessions = pgTable("screening_sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age"),
  email: text("email"),
  status: text("status").notNull().default("in_progress"),
  results: jsonb("results"),
  conversationId: integer("conversation_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertScreeningSessionSchema = createInsertSchema(screeningSessions).omit({
  id: true,
  createdAt: true,
});

export type ScreeningSession = typeof screeningSessions.$inferSelect;
export type InsertScreeningSession = z.infer<typeof insertScreeningSessionSchema>;
