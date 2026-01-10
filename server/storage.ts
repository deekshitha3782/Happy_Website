import { messages, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMessages(): Promise<Message[]> {
    try {
      const result = await db.select().from(messages).orderBy(asc(messages.createdAt));
      console.log(`DatabaseStorage.getMessages: Retrieved ${result.length} messages`);
      return result;
    } catch (error) {
      console.error("DatabaseStorage.getMessages error:", error);
      throw error;
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      console.log("DatabaseStorage.createMessage: Inserting message", { role: insertMessage.role });
      const [message] = await db.insert(messages).values(insertMessage).returning();
      console.log("DatabaseStorage.createMessage: Message created with ID", message.id);
      return message;
    } catch (error) {
      console.error("DatabaseStorage.createMessage error:", error);
      throw error;
    }
  }
  
  async clearMessages(): Promise<void> {
    try {
      await db.delete(messages);
      console.log("DatabaseStorage.clearMessages: All messages cleared");
    } catch (error) {
      console.error("DatabaseStorage.clearMessages error:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
