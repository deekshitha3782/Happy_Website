import { messages, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  getMessages(sessionType?: string, deviceId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(sessionType?: string, deviceId?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMessages(sessionType?: string, deviceId?: string): Promise<Message[]> {
    try {
      let result;
      if (sessionType) {
        // Filter by session type (chat or call) and optionally deviceId
        // sessionType now includes deviceId (e.g., "call-device-abc123")
        // This ensures each device has separate conversations
        result = await db.select().from(messages)
          .where(eq(messages.sessionType, sessionType))
          .orderBy(asc(messages.createdAt));
        console.log(`DatabaseStorage.getMessages: Retrieved ${result.length} messages for session: ${sessionType}`);
      } else {
        // Get all messages (backward compatibility)
        result = await db.select().from(messages).orderBy(asc(messages.createdAt));
        console.log(`DatabaseStorage.getMessages: Retrieved ${result.length} messages (all sessions)`);
      }
      return result;
    } catch (error) {
      console.error("DatabaseStorage.getMessages error:", error);
      throw error;
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      // Ensure sessionType is set (default to 'chat' if not provided)
      const messageWithSession = {
        ...insertMessage,
        sessionType: (insertMessage as any).sessionType || "chat"
      };
      console.log("DatabaseStorage.createMessage: Inserting message", { 
        role: insertMessage.role, 
        sessionType: messageWithSession.sessionType 
      });
      const [message] = await db.insert(messages).values(messageWithSession as any).returning();
      console.log("DatabaseStorage.createMessage: Message created with ID", message.id);
    return message;
    } catch (error) {
      console.error("DatabaseStorage.createMessage error:", error);
      throw error;
    }
  }
  
  async clearMessages(sessionType?: string, deviceId?: string): Promise<void> {
    try {
      if (sessionType) {
        // Clear only messages for this session (which includes deviceId)
        // sessionType now includes deviceId (e.g., "call-device-abc123")
        await db.delete(messages).where(eq(messages.sessionType, sessionType));
        console.log(`DatabaseStorage.clearMessages: Cleared messages for session: ${sessionType}`);
      } else {
        // Clear all messages (backward compatibility)
    await db.delete(messages);
        console.log("DatabaseStorage.clearMessages: All messages cleared");
      }
    } catch (error) {
      console.error("DatabaseStorage.clearMessages error:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
