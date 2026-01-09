import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize OpenAI client
  const openai = new OpenAI({ 
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "dummy-key",
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  });

  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const input = api.messages.create.input.parse(req.body);
      
      // 1. Save user message
      await storage.createMessage(input);

      // 2. Get history for context
      const history = await storage.getMessages();
      const messagesForAI = history.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      }));

      // 3. System prompt for supportive persona
      const systemMessage = {
        role: "system" as const,
        content: "You are a compassionate, supportive, and empathetic AI companion. Your goal is to help users who may be feeling depressed, anxious, or down. Listen actively, validate their feelings, offer gentle encouragement, and help them find small, positive steps. Do not be overly clinical. Be warm and human-like. If a user expresses intent of self-harm, gently encourage them to seek professional help and provide resources, but focus on immediate emotional support."
      };

      // 4. Call OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [systemMessage, ...messagesForAI],
      });

      const aiContent = response.choices[0].message.content || "I'm here for you, but I'm having trouble finding the right words right now.";

      // 5. Save assistant message
      const assistantMessage = await storage.createMessage({
        role: "assistant",
        content: aiContent
      });

      // 6. Return the assistant message
      res.status(201).json(assistantMessage);
      
    } catch (err) {
      console.error("Chat error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  app.post(api.messages.clear.path, async (req, res) => {
      await storage.clearMessages();
      res.status(204).send();
  });

  // Seed data
  const existingMessages = await storage.getMessages();
  if (existingMessages.length === 0) {
    await storage.createMessage({ role: "assistant", content: "Hello! I'm here to listen and support you. How are you feeling today?" });
    await storage.createMessage({ role: "user", content: "I've been feeling a bit overwhelmed lately." });
    await storage.createMessage({ role: "assistant", content: "I hear you. Feeling overwhelmed is tough, but you're not alone. I'm here to support you. What's been on your mind?" });
  }

  return httpServer;
}
