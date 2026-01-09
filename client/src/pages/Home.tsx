import { Link } from "wouter";
import { motion } from "framer-motion";
import { CloudSun, HeartHandshake, Volume2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-orange-50/50 flex flex-col font-sans overflow-x-hidden">
      {/* Hero Section */}
      <header className="px-6 pt-20 pb-16 md:pt-32 md:pb-24 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-24 h-24 bg-gradient-to-tr from-primary/20 to-secondary rounded-full flex items-center justify-center mb-8 mx-auto animate-float shadow-xl shadow-primary/10"
        >
          <CloudSun size={48} className="text-primary drop-shadow-md" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-6xl font-bold text-foreground mb-6 font-display tracking-tight"
        >
          Your Safe Haven <br /> for <span className="text-primary italic">Calm</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
        >
          Step away from the noise and find a moment of peace. Serenity AI is here to listen, support, and help you find your center, one conversation at a time.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Link href="/chat">
            <Button size="lg" className="rounded-full px-8 py-6 text-lg group hover-elevate active-elevate-2 shadow-lg shadow-primary/20">
              Begin Your Journey
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </header>

      {/* Features Grid */}
      <section className="px-6 py-16 md:py-24 bg-white/40 backdrop-blur-sm border-y border-white/50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex gap-6"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
              <HeartHandshake size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Supportive Presence</h3>
              <p className="text-muted-foreground leading-relaxed">
                An empathetic listener that doesn't judge. Whether you're feeling down, anxious, or just need to vent, we're here 24/7.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex gap-6"
          >
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 flex-shrink-0">
              <Volume2 size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Soothing Voice</h3>
              <p className="text-muted-foreground leading-relaxed">
                Toggle Voice Mode to have responses read aloud in a gentle, calming tone. Sometimes hearing a supportive voice makes all the difference.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 text-center text-muted-foreground/60 border-t border-white/30">
        <p className="max-w-md mx-auto text-sm leading-relaxed">
          Serenity AI is an empathetic companion for emotional support. <br />
          If you are in immediate danger or need professional medical help, please contact local emergency services or a mental health professional.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs font-medium uppercase tracking-widest">
          <span>Peace</span>
          <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
          <span>Privacy</span>
          <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
          <span>Support</span>
        </div>
      </footer>
    </div>
  );
}
