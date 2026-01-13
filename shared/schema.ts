import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  sessionType: text("session_type").default("chat"), // 'chat' or 'call' - separates conversations
  deviceId: text("device_id"), // Unique device/browser identifier - separates different devices
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
