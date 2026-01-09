import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex justify-start gap-4 mb-6">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-sm">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-2 h-2 bg-primary rounded-full"
        />
      </div>
      <div className="bg-white/80 px-6 py-4 rounded-2xl rounded-tl-none border border-secondary/30 flex items-center gap-1.5 shadow-sm">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
          className="w-2 h-2 bg-muted-foreground/40 rounded-full"
        />
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
          className="w-2 h-2 bg-muted-foreground/40 rounded-full"
        />
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
          className="w-2 h-2 bg-muted-foreground/40 rounded-full"
        />
      </div>
    </div>
  );
}
