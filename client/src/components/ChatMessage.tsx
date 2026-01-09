import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Message } from "@shared/schema";
import { Sparkles, User } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAi = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex w-full gap-4 mb-6",
        isAi ? "justify-start" : "justify-end"
      )}
    >
      {isAi && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-sm mt-1">
          <Sparkles size={18} />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] md:max-w-[70%] px-6 py-4 rounded-2xl shadow-sm text-base md:text-lg leading-relaxed",
          isAi
            ? "bg-white text-foreground rounded-tl-none border border-secondary/30"
            : "bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-primary/20"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>

      {!isAi && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shadow-sm mt-1">
          <User size={18} />
        </div>
      )}
    </motion.div>
  );
}
