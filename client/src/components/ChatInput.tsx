import { useState, useRef, useEffect } from "react";
import { SendHorizontal } from "lucide-react";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-lg shadow-black/5 border border-secondary/50 p-2 flex items-end gap-2 transition-shadow focus-within:shadow-xl focus-within:border-primary/30"
    >
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Share what's on your mind..."
        disabled={disabled}
        className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[52px] py-3.5 px-5 text-lg placeholder:text-muted-foreground/60 text-foreground rounded-2xl"
        rows={1}
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="submit"
        disabled={!message.trim() || disabled}
        className="mb-1 p-3 rounded-2xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-primary/90 shadow-md shadow-primary/20"
      >
        <SendHorizontal size={20} className="ml-0.5" />
      </motion.button>
    </form>
  );
}
