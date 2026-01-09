import { useState, useRef, useEffect } from "react";
import { SendHorizontal, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setMessage(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage("");
      if (isRecording) {
        recognitionRef.current.stop();
      }
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
      <motion.button
        type="button"
        onClick={toggleRecording}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "mb-1 p-3 rounded-2xl transition-all duration-300",
          isRecording 
            ? "bg-destructive text-destructive-foreground animate-pulse shadow-md shadow-destructive/20" 
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
        title={isRecording ? "Stop recording" : "Record your voice"}
      >
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="mic-off"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <MicOff size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="mic-on"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Mic size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isRecording ? "Listening..." : "Share what's on your mind..."}
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
