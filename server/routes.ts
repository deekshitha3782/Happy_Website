import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import Groq from "groq-sdk";
import type { Message } from "@shared/schema";

// Free fallback response generator - improved with context awareness
function generateFallbackResponse(userMessage: string, history: Message[]): string {
  const message = userMessage.toLowerCase().trim();
  const recentUserMessages = history
    .filter(m => m.role === "user")
    .slice(-3)
    .map(m => m.content.toLowerCase());
  
  // Get context from recent conversation
  const conversationContext = recentUserMessages.join(" ");
  
  // Check if this is a continuation of a topic
  const lastAssistantMessage = history
    .filter(m => m.role === "assistant")
    .slice(-1)[0]?.content || "";
  
  // Extract key topics from conversation
  const hasSadness = conversationContext.match(/(sad|depressed|down|unhappy|miserable|hopeless|empty|crying|tears)/);
  const hasAnxiety = conversationContext.match(/(anxious|stressed|worried|nervous|overwhelmed|panic|fear|scared|afraid)/);
  const hasLoneliness = conversationContext.match(/(lonely|alone|isolated|no one|nobody|friendless|abandoned)/);
  const hasAnger = conversationContext.match(/(angry|mad|frustrated|annoyed|irritated|rage|hate)/);
  const hasTiredness = conversationContext.match(/(tired|exhausted|drained|worn out|burnout|fatigue)/);
  const isQuestion = message.match(/\?/);
  const isShort = message.split(/\s+/).length <= 3;
  
  // Personalized responses based on context
  if (message.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
    const greetings = [
      "Hello! I'm here to listen and support you. How are you feeling today?",
      "Hi there! It's good to hear from you. What's on your mind?",
      "Hey! I'm glad you reached out. How can I support you today?",
    ];
    return greetings[userMessage.length % greetings.length];
  }
  
  // Handle questions
  if (isQuestion) {
    if (message.match(/(how|what|why|when|where|who)/)) {
      if (message.match(/(feel|feeling|doing|going)/)) {
        return "I appreciate you asking. Right now, I'm here to focus on you and how you're feeling. Can you tell me more about what you're experiencing?";
      }
      if (message.match(/(help|should|can|could|would)/)) {
        return "That's a thoughtful question. While I can offer support and listen, for specific advice, it might help to talk to someone who knows your full situation. But I'm here to listen - what's been on your mind?";
      }
      return "I hear your question. Can you help me understand what you're looking for? I'm here to listen and support you.";
    }
  }
  
  // Context-aware responses based on conversation history
  if (hasSadness && message.match(/(yes|yeah|yep|true|exactly|right)/)) {
    return "I can see this is really affecting you. It's okay to feel this way - your emotions are valid. What's been the hardest part about this for you?";
  }
  
  if (hasAnxiety && (message.match(/(yes|yeah|yep|true|exactly|right|always|constantly)/) || isShort)) {
    return "Anxiety can feel like it's taking over, but remember - these feelings will pass. You're safe right now. What specific situation is making you feel anxious?";
  }
  
  // Specific emotion responses with variation
  if (hasSadness || message.match(/(sad|depressed|down|unhappy|miserable|hopeless|empty|crying)/)) {
    const responses = [
      "I'm really sorry you're going through this. Feeling sad or down is incredibly difficult, and I want you to know that your feelings matter. Can you tell me more about what's been making you feel this way?",
      "It sounds like you're carrying a lot of sadness right now. That must be really hard. You don't have to go through this alone. What's been weighing on your heart?",
      "I hear the pain in what you're saying. Depression and sadness can make everything feel heavy. You're brave for reaching out. What would help you feel even a little bit better right now?",
    ];
    return responses[userMessage.length % responses.length];
  }
  
  if (hasAnxiety || message.match(/(anxious|stressed|worried|nervous|overwhelmed|panic|fear|scared)/)) {
    const responses = [
      "Anxiety can feel overwhelming, but you're doing the right thing by talking about it. Take a moment to breathe with me. What specific worry has been on your mind?",
      "I understand that stress and anxiety can make everything feel like too much. You're not alone in feeling this way. What's been causing you to feel anxious? Sometimes naming it can help.",
      "Feeling anxious or stressed is really tough. Your body might be reacting to something it perceives as a threat, even if logically you know you're safe. What situation has been triggering these feelings?",
    ];
    return responses[userMessage.length % responses.length];
  }
  
  if (hasLoneliness || message.match(/(lonely|alone|isolated|no one|nobody|friendless)/)) {
    const responses = [
      "Feeling lonely can be one of the hardest emotions to sit with. I want you to know that you matter, and your presence in this world has value. What would help you feel more connected?",
      "Loneliness is really painful, and I'm sorry you're experiencing that. Even when it feels like no one understands, you're not truly alone. What's been making you feel isolated?",
      "I hear how alone you're feeling. That's a heavy weight to carry. Connection can be hard to find sometimes, but you reaching out shows courage. What kind of connection are you looking for?",
    ];
    return responses[userMessage.length % responses.length];
  }
  
  if (hasAnger || message.match(/(angry|mad|frustrated|annoyed|irritated|rage)/)) {
    const responses = [
      "Anger is a valid emotion, and it often comes from feeling hurt or powerless. I hear your frustration. What's been making you feel this way?",
      "Feeling angry or frustrated can be really intense. Sometimes anger is protecting us from other feelings underneath. What's been triggering these feelings for you?",
      "I understand you're feeling angry, and those feelings are completely valid. Anger often signals that something important to us feels threatened. What's been happening that's made you feel this way?",
    ];
    return responses[userMessage.length % responses.length];
  }
  
  if (hasTiredness || message.match(/(tired|exhausted|drained|worn out|burnout|can't go on)/)) {
    const responses = [
      "It sounds like you're completely drained. That level of exhaustion is real and valid. You don't have to push through everything. What's been taking so much of your energy?",
      "Feeling exhausted and worn out is your body and mind telling you that you need rest. It's okay to slow down. What's been draining you the most?",
      "Burnout and exhaustion are serious, and I'm sorry you're experiencing this. You're doing the best you can, and that's enough. What would help you recharge, even a little?",
    ];
    return responses[userMessage.length % responses.length];
  }
  
  // Thank you responses
  if (message.match(/(thank|thanks|appreciate|grateful)/)) {
    const responses = [
      "You're so welcome. I'm really glad I can be here for you. How are you feeling now? Is there anything else you'd like to talk about?",
      "I'm happy to help. You deserve support, and I'm glad you're reaching out. How are things feeling for you right now?",
      "Of course. You're not alone in this, and I'm here whenever you need to talk. What else is on your mind?",
    ];
    return responses[userMessage.length % responses.length];
  }
  
  // Continuation responses - if user is elaborating
  if (lastAssistantMessage && message.length > 20) {
    const responses = [
      "I'm listening. Can you tell me more about that?",
      "Thank you for sharing more. I'm here with you. What else comes up when you think about this?",
      "I hear you. Keep going - I'm listening. What's the hardest part about this for you?",
      "Thank you for opening up more. Your feelings are valid. What would help you feel supported right now?",
    ];
    return responses[userMessage.length % responses.length];
  }
  
  // Short responses - user might be testing or giving brief answers
  if (isShort && !isQuestion) {
    const responses = [
      "I hear you. Can you tell me a bit more about what you're experiencing?",
      "I'm listening. What's been on your mind?",
      "I'm here for you. What would you like to talk about?",
    ];
    return responses[userMessage.length % responses.length];
  }
  
  // Default empathetic responses with more variety
  const responses = [
    "I hear you, and I want you to know that your feelings are completely valid. You're not alone in this. Can you tell me more about what's been on your mind?",
    "Thank you for sharing that with me. It takes real strength to open up. I'm here to listen without judgment. What would be most helpful for you right now?",
    "I understand this is difficult, and I want you to know that you're doing the best you can - and that's enough. What's been weighing on you?",
    "Your feelings matter, and I'm glad you're expressing them. Sometimes just talking about what we're going through can help lighten the load. What would make you feel a little better right now?",
    "I'm here with you through this. You don't have to face it alone. What's been the hardest part about what you're going through?",
    "I appreciate you trusting me with this. Your experiences are valid, and you deserve support. Can you help me understand what you need right now?",
    "I'm listening, and I want you to know that what you're feeling makes sense. You're not wrong for feeling this way. What's been on your mind lately?",
  ];
  
  // Use a combination of factors to pick response for more variety
  const index = (userMessage.length + history.length) % responses.length;
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

  // Initialize Groq client (free LLM API)
  const groqApiKey = process.env.GROQ_API_KEY;
  console.log("🔍 DEBUG: GROQ_API_KEY check:", {
    exists: !!groqApiKey,
    length: groqApiKey?.length || 0,
    startsWith: groqApiKey?.substring(0, 4) || "none",
    allEnvVars: Object.keys(process.env).filter(k => k.includes("GROQ") || k.includes("OPENAI"))
  });
  const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
  if (!groqApiKey) {
    console.log("⚠️ WARNING: GROQ_API_KEY not set. Get a free key at https://console.groq.com/keys");
  } else {
    console.log("✅ Groq client initialized successfully");
  }

  // Health check endpoint to keep Render service awake
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
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
      
      // 1. Validate user message - prevent empty or very short messages
      const userMessage = input.content.trim();
      if (!userMessage || userMessage.length < 2) {
        console.log("POST /api/messages - Rejected: message too short or empty");
        return res.status(400).json({ 
          error: "Message too short. Please speak clearly or type a longer message." 
        });
      }
      
      // Save user message
      await storage.createMessage(input);
      console.log("POST /api/messages - User message saved:", userMessage.substring(0, 50));

      // 2. Get history for context
      const history = await storage.getMessages();
      console.log(`POST /api/messages - Got ${history.length} messages from history`);
      const messagesForAI = history.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      }));

      // 3. System prompt for focused depression recovery guide
      const systemMessage = {
        role: "system" as const,
        content: "You are a focused depression recovery guide. Your ONLY purpose is to help the user overcome their depression. Stay strictly on topic - only discuss depression, their feelings, recovery strategies, and steps to feel better. Do NOT talk about irrelevant topics like weather, news, entertainment, or general chit-chat. Every response must directly address their depression and help them move forward. Be warm, compassionate, and understanding. Validate their feelings, then provide practical guidance and actionable steps. Keep responses CONCISE - use short sentences (2-3 sentences max), but make sure to cover the full context. Focus on: understanding their depression, identifying triggers, providing coping strategies, encouraging small positive steps, and guiding them toward recovery. If they try to change topics, gently redirect back to their depression and how you can help. If a user expresses intent of self-harm, immediately encourage them to seek professional help and provide crisis resources."
      };

      // 4. Call LLM API (OpenAI -> Groq -> fallback)
      console.log("POST /api/messages - Calling LLM API...");
      
      let aiContent: string = "";
      
      // Try OpenAI first if key is available
      if (openaiApiKey && openaiApiKey !== "dummy-key") {
        try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [systemMessage, ...messagesForAI],
        max_tokens: 150, // Keep responses concise (2-3 sentences)
        temperature: 0.8, // Slightly higher for more lively, energetic responses
      });
          aiContent = response.choices[0].message.content || "";
          console.log("POST /api/messages - OpenAI response received, length:", aiContent.length);
        } catch (openaiError: any) {
          console.error("OpenAI API error:", openaiError);
          if (openaiError?.status === 401) {
            throw new Error("Invalid OpenAI API key. Please check your API key in Render environment variables.");
          }
          // Fall through to Groq or fallback
          console.log("OpenAI failed, trying Groq (free LLM)...");
        }
      }
      
      // If OpenAI didn't work or wasn't available, try Groq (free LLM)
      if (!aiContent) {
        // Check environment variable at request time (in case it was added after server start)
        const currentGroqKey = process.env.GROQ_API_KEY;
        let groqClient = groq;
        
        // If groq client is null but we have a key now, create it
        if (!groqClient && currentGroqKey) {
          console.log("🔄 Creating Groq client with runtime environment variable");
          groqClient = new Groq({ apiKey: currentGroqKey });
        }
        
        if (groqClient) {
          try {
            console.log("POST /api/messages - Calling Groq API (free LLM)...");
            console.log("🔍 DEBUG: Groq request:", {
              model: "llama-3.1-8b-instant",
              messageCount: messagesForAI.length,
              hasSystemMessage: !!systemMessage,
              apiKeySet: !!currentGroqKey,
              apiKeyLength: currentGroqKey?.length || 0
            });
            const response = await groqClient.chat.completions.create({
              model: "llama-3.1-8b-instant", // Free, fast model (updated from deprecated 70b)
              messages: [systemMessage, ...messagesForAI],
              temperature: 0.8, // Slightly higher for more lively, energetic responses
              max_tokens: 150, // Reduced to encourage concise, shorter responses (2-3 sentences)
            });
            aiContent = response.choices[0].message.content || "";
            console.log("✅ POST /api/messages - Groq response received, length:", aiContent.length);
            console.log("🔍 DEBUG: Groq response preview:", aiContent.substring(0, 100));
          } catch (groqError: any) {
            console.error("❌ Groq API error:", {
              message: groqError?.message,
              status: groqError?.status,
              statusText: groqError?.statusText,
              error: String(groqError),
              stack: groqError?.stack?.substring(0, 200)
            });
            console.log("Groq failed, trying Hugging Face (free, no API key)...");
          }
        } else {
          console.log("⚠️ WARNING: Groq client is null. GROQ_API_KEY may not be set correctly.");
          console.log("🔍 DEBUG: Environment check at request time:", {
            groqApiKeyExists: !!currentGroqKey,
            groqApiKeyLength: currentGroqKey?.length || 0,
            groqApiKeyPreview: currentGroqKey ? currentGroqKey.substring(0, 10) + "..." : "none",
            startupGroqKeyExists: !!groqApiKey
          });
        }
      }
      
      // Try Hugging Face Inference API (free, no API key needed for some models)
      if (!aiContent) {
        try {
          console.log("POST /api/messages - Calling Hugging Face Inference API (free LLM, no key needed)...");
          
          // Format messages for Hugging Face
          const hfMessages = [
            { role: "system", content: systemMessage.content },
            ...messagesForAI.map(m => ({ role: m.role, content: m.content }))
          ];
          
          // Use Meta's Llama 3.1 8B model via Hugging Face (free, public) - updated endpoint
          const hfResponse = await fetch(
            "https://router.huggingface.co/models/meta-llama/Meta-Llama-3.1-8B-Instruct",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inputs: hfMessages.map(m => `${m.role}: ${m.content}`).join("\n") + "\nassistant:",
                parameters: {
                  max_new_tokens: 150, // Reduced to encourage concise, shorter responses
                  temperature: 0.8, // Slightly higher for more lively responses
                  return_full_text: false,
                },
              }),
            }
          );
          
          if (hfResponse.ok) {
            const hfData = await hfResponse.json();
            if (hfData && hfData[0] && hfData[0].generated_text) {
              aiContent = hfData[0].generated_text.trim();
              console.log("POST /api/messages - Hugging Face response received, length:", aiContent.length);
            }
          } else {
            const errorText = await hfResponse.text();
            console.error("Hugging Face API error:", hfResponse.status, errorText);
          }
        } catch (hfError: any) {
          console.error("Hugging Face API error:", hfError);
          console.log("Hugging Face failed, will use fallback responses");
        }
      }
      
      // Together AI removed - requires API key, not truly free
      
      // Last resort: use hardcoded fallback
      if (!aiContent) {
        console.log("All LLM APIs failed, using hardcoded fallback responses");
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
