import { useEffect, useRef, useState } from "react";
import { useMessages, useSendMessage, useClearChat } from "@/hooks/use-messages";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { Trash2, HeartHandshake, CloudSun, Volume2, VolumeX, Phone } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const { data: messages, isLoading, error: messagesError } = useMessages();
  const { mutate: sendMessage, isPending: isSending, error: sendError } = useSendMessage();
  const { mutate: clearChat, isPending: isClearing } = useClearChat();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const lastReadMessageId = useRef<number | null>(null);

  // Voice output logic
  useEffect(() => {
    if (!isVoiceEnabled || !messages) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.id !== lastReadMessageId.current) {
      const utterance = new SpeechSynthesisUtterance(lastMessage.content);
      // Try to find a calming voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Google US English")) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.rate = 0.9; // Slightly slower for calming effect
      utterance.pitch = 1.0;
      
      window.speechSynthesis.cancel(); // Stop any current speech
      window.speechSynthesis.speak(utterance);
      lastReadMessageId.current = lastMessage.id;
    }
  }, [messages, isVoiceEnabled]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending]);

  const handleSend = (content: string) => {
    sendMessage(
      { role: "user", content },
      {
        onError: (error: Error) => {
          console.error("Error sending message:", error);
          toast({
            title: "Failed to send message",
            description: error.message || "Please check your connection and try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  // Show error toasts
  useEffect(() => {
    if (messagesError) {
      console.error("Error loading messages:", messagesError);
      toast({
        title: "Failed to load messages",
        description: "Could not load chat history. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [messagesError, toast]);

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (!isVoiceEnabled) {
      // Small feedback that voice is now on
      const utterance = new SpeechSynthesisUtterance("Voice mode enabled");
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-orange-50/50 flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/70 backdrop-blur-lg border-b border-white/50 z-10 flex items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center text-primary">
              <CloudSun size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Serenity AI</h1>
              <p className="text-xs text-muted-foreground font-medium">Your safe space to talk</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/call">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-500 text-white rounded-xl transition-all shadow-sm hover:bg-green-600 shadow-green-500/20">
                <Phone size={16} />
                <span className="hidden sm:inline">Call AI</span>
              </button>
            </Link>

            <button
              onClick={toggleVoice}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all shadow-sm",
                isVoiceEnabled 
                  ? "bg-primary text-primary-foreground shadow-primary/20" 
                  : "bg-white/70 text-muted-foreground hover:bg-white"
              )}
            >
              {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="hidden sm:inline">{isVoiceEnabled ? "Voice On" : "Voice Off"}</span>
            </button>

            <button
              onClick={() => clearChat()}
              disabled={!messages?.length || isClearing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto pt-24 pb-32 px-4 md:px-6">
        <AnimatePresence initial={false}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground animate-pulse">
              <HeartHandshake size={48} className="mb-4 opacity-50" />
              <p>Preparing your safe space...</p>
            </div>
          ) : messages?.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-[60vh] text-center max-w-lg mx-auto"
            >
              <div className="w-24 h-24 bg-gradient-to-tr from-primary/20 to-secondary rounded-full flex items-center justify-center mb-6 animate-float">
                <CloudSun size={40} className="text-primary-foreground drop-shadow-md" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3 font-display">Hello, friend.</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                I'm here to listen without judgment. Whether you're feeling down, anxious, or just need to chat, I'm here for you.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {["I'm feeling a bit lonely today", "I've been really stressed lately", "Can you help me find some calm?"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="px-4 py-2 bg-white/60 hover:bg-white border border-secondary/50 rounded-full text-sm text-foreground/80 hover:text-primary transition-all shadow-sm hover:shadow-md"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {messages?.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isSending && <TypingIndicator />}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-white via-white/80 to-transparent z-20">
        <ChatInput onSend={handleSend} disabled={isSending || isLoading} />
        <p className="text-center text-xs text-muted-foreground/50 mt-3">
          I am an AI here to support you, but I cannot replace professional help.
        </p>
      </footer>
    </div>
  );
}
