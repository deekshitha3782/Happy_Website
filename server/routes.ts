import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import type { Message } from "@shared/schema";

// Free fallback response generator
function generateFallbackResponse(userMessage: string, history: Message[]): string {
  const message = userMessage.toLowerCase();
  
  // Greeting responses
  if (message.match(/^(hi|hello|hey|greetings)/)) {
    return "Hello! I'm here to listen and support you. How are you feeling today?";
  }
  
  // Sadness/depression keywords
  if (message.match(/(sad|depressed|down|unhappy|miserable|hopeless|empty)/)) {
    return "I'm sorry you're feeling this way. Your feelings are valid, and it takes courage to share them. You're not alone in this. Would you like to talk about what's been weighing on you?";
  }
  
  // Anxiety/stress keywords
  if (message.match(/(anxious|stressed|worried|nervous|overwhelmed|panic|fear)/)) {
    return "I understand that anxiety and stress can feel overwhelming. Take a deep breath with me. You're safe right now. What's been causing you to feel this way? Sometimes talking about it can help.";
  }
  
  // Loneliness
  if (message.match(/(lonely|alone|isolated|no one|nobody cares)/)) {
    return "Feeling lonely can be really tough. I want you to know that you matter, and your feelings matter. Even when it feels like no one is there, you're not truly alone. What would help you feel more connected right now?";
  }
  
  // Tired/exhausted
  if (message.match(/(tired|exhausted|drained|worn out|can't|can not)/)) {
    return "It sounds like you're carrying a lot right now. That must be exhausting. Remember, it's okay to rest and take things one step at a time. What's been draining your energy?";
  }
  
  // Anger/frustration
  if (message.match(/(angry|mad|frustrated|annoyed|irritated)/)) {
    return "I hear your frustration. Those feelings are completely valid. Sometimes anger is a response to feeling hurt or powerless. What's been making you feel this way?";
  }
  
  // Questions about help
  if (message.match(/(help|what should|what can|advice|suggest)/)) {
    return "I'm here to support you. Sometimes the best thing we can do is take small, gentle steps. What feels manageable right now? Even something small like taking a few deep breaths or going for a short walk can help.";
  }
  
  // Thank you
  if (message.match(/(thank|thanks|appreciate)/)) {
    return "You're so welcome. I'm glad I can be here for you. How are you feeling now? Is there anything else you'd like to talk about?";
  }
  
  // Default empathetic response
  const responses = [
    "I hear you, and I want you to know that your feelings are valid. You're not alone in this. Can you tell me more about what's on your mind?",
    "Thank you for sharing that with me. It takes strength to open up. I'm here to listen. What would be helpful for you right now?",
    "I understand this is difficult. You're doing the best you can, and that's enough. What's been weighing on you?",
    "Your feelings matter, and I'm glad you're expressing them. Sometimes just talking about it can help. What would make you feel a little better right now?",
    "I'm here with you through this. You don't have to face it alone. What's been on your mind lately?",
  ];
  
  // Use message length to pick a response (simple hash)
  const index = userMessage.length % responses.length;
  return responses[index];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize OpenAI client
  const openaiApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!openaiApiKey || openaiApiKey === "dummy-key") {
    console.error("⚠️ WARNING: AI_INTEGRATIONS_OPENAI_API_KEY is not set or is dummy-key");
  }
  
  const openai = new OpenAI({ 
    apiKey: openaiApiKey || "dummy-key",
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  });

  app.get(api.messages.list.path, async (req, res) => {
    try {
      console.log("GET /api/messages - Fetching messages");
      const messages = await storage.getMessages();
      console.log(`GET /api/messages - Found ${messages.length} messages`);
      res.json(messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ message: "Failed to fetch messages", error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      console.log("POST /api/messages - Received request");
      const input = api.messages.create.input.parse(req.body);
      console.log("POST /api/messages - Input validated:", { role: input.role, contentLength: input.content.length });
      
      // 1. Save user message
      await storage.createMessage(input);
      console.log("POST /api/messages - User message saved");

      // 2. Get history for context
      const history = await storage.getMessages();
      console.log(`POST /api/messages - Got ${history.length} messages from history`);
      const messagesForAI = history.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      }));

      // 3. System prompt for supportive persona
      const systemMessage = {
        role: "system" as const,
        content: "You are a compassionate, supportive, and empathetic AI companion. Your goal is to help users who may be feeling depressed, anxious, or down. Listen actively, validate their feelings, offer gentle encouragement, and help them find small, positive steps. Do not be overly clinical. Be warm and human-like. If a user expresses intent of self-harm, gently encourage them to seek professional help and provide resources, but focus on immediate emotional support."
      };

      // 4. Call OpenAI or use fallback
      console.log("POST /api/messages - Calling OpenAI API...");
      
      let aiContent: string;
      
      // Try OpenAI first if key is available
      if (openaiApiKey && openaiApiKey !== "dummy-key") {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemMessage, ...messagesForAI],
          });
          aiContent = response.choices[0].message.content || "";
          console.log("POST /api/messages - OpenAI response received, length:", aiContent.length);
        } catch (openaiError: any) {
          console.error("OpenAI API error:", openaiError);
          if (openaiError?.status === 429 || openaiError?.status === 402) {
            console.log("OpenAI quota exceeded, using free fallback responses");
            aiContent = generateFallbackResponse(input.content, history);
          } else if (openaiError?.status === 401) {
            throw new Error("Invalid OpenAI API key. Please check your API key in Render environment variables.");
          } else {
            // For other errors, use fallback
            console.log("OpenAI error, using free fallback responses");
            aiContent = generateFallbackResponse(input.content, history);
          }
        }
      } else {
        // No API key, use free fallback
        console.log("No OpenAI API key, using free fallback responses");
        aiContent = generateFallbackResponse(input.content, history);
      }

      // 5. Save assistant message
      const assistantMessage = await storage.createMessage({
        role: "assistant",
        content: aiContent
      });
      console.log("POST /api/messages - Assistant message saved, ID:", assistantMessage.id);

      // 6. Generate speech if requested (mock for now, or use OpenAI TTS if available)
      // Since OpenAI AI integration might not support TTS yet, we'll keep it simple.
      // But for "speech" we can use browser-side TTS or a mock audio response.
      
      // 7. Return the assistant message
      res.status(201).json(assistantMessage);
      
    } catch (err) {
      console.error("Chat error:", err);
      if (err instanceof z.ZodError) {
        console.error("Validation error:", err.errors);
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Full error:", errorMessage);
      res.status(500).json({ 
        message: "Failed to generate response",
        error: errorMessage
      });
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
