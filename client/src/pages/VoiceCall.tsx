import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, CloudSun, HeartHandshake } from "lucide-react";
import { useMessages, useSendMessage, useClearChat } from "@/hooks/use-messages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { configureFemaleVoice, waitForVoices } from "@/utils/voice";

export default function VoiceCall() {
  const [, setLocation] = useLocation();
  const { data: messages } = useMessages();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: clearChat } = useClearChat();
  
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [transcript, setTranscript] = useState("");
  
  const recognitionRef = useRef<any>(null);
  const lastReadMessageId = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  // Stop any chat voice and clear chat when Call AI starts, then send greeting
  useEffect(() => {
    // Stop any ongoing speech from chat immediately
    window.speechSynthesis.cancel();
    
    // Clear chat and send greeting on first mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      
      // Clear existing messages first
      clearChat(undefined, {
        onSuccess: () => {
          // After clearing, send a greeting trigger to start fresh conversation
          // The AI will respond with a warm greeting
          setTimeout(() => {
            sendMessage(
              { role: "user", content: "Hi, I'd like to talk" },
              {
                onSuccess: () => {
                  // The AI will generate a greeting response asking what's the issue
                },
              }
            );
          }, 800); // Delay to ensure chat is fully cleared
        },
      });
    }
  }, [clearChat, sendMessage]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setCallStatus("Connected");
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const final = event.results[i][0].transcript.trim();
            if (final) {
              sendMessage({ role: "user", content: final });
            }
          } else {
            currentTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        if (!isMuted) {
          recognitionRef.current.start();
        }
      };

      recognitionRef.current.start();
    } else {
      setCallStatus("Speech not supported");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, [sendMessage, isMuted]);

  // Voice Output (TTS) with consistent female voice
  useEffect(() => {
    if (!isSpeakerOn || !messages) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.id !== lastReadMessageId.current) {
      // Wait for voices to be loaded, then speak
      const cleanup = waitForVoices(() => {
        const utterance = new SpeechSynthesisUtterance(lastMessage.content);
        configureFemaleVoice(utterance);
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        lastReadMessageId.current = lastMessage.id;
      });

      return cleanup;
    }
  }, [messages, isSpeakerOn]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleEndCall = () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clear all messages from the call so they don't appear in chat
    clearChat(undefined, {
      onSuccess: () => {
        // Navigate to chat after clearing
        setLocation("/chat");
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-8 font-sans overflow-hidden">
      {/* Top Info */}
      <header className="w-full flex flex-col items-center gap-2 mt-12">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-4"
        >
          <CloudSun size={32} />
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight">Serenity AI</h1>
        <p className={cn(
          "text-sm font-medium transition-colors",
          callStatus === "Connected" ? "text-green-400" : "text-slate-400"
        )}>
          {callStatus}
        </p>
      </header>

      {/* Visualizer / Avatar */}
      <main className="relative flex items-center justify-center">
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-64 h-64 bg-primary/20 rounded-full"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute w-64 h-64 bg-primary/10 rounded-full"
              />
            </>
          )}
        </AnimatePresence>
        
        <div className="relative w-48 h-48 bg-gradient-to-tr from-primary to-blue-400 rounded-full flex items-center justify-center shadow-2xl shadow-primary/20 z-10">
          <HeartHandshake size={64} className="text-white" />
          {isSending && (
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-white/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>
      </main>

      {/* Transcript / Subtitles */}
      <div className="w-full max-w-md text-center h-24 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {transcript ? (
            <motion.p 
              key="transcript"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg text-slate-300 italic font-medium"
            >
              "{transcript}"
            </motion.p>
          ) : isSending ? (
            <motion.p 
              key="listening"
              className="text-slate-500 text-sm tracking-widest uppercase font-bold"
            >
              Listening...
            </motion.p>
          ) : (
            <motion.p 
              key="waiting"
              className="text-slate-500 text-sm tracking-widest uppercase font-bold"
            >
              Speak freely
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <footer className="w-full max-w-sm grid grid-cols-3 gap-8 mb-12">
        <div className="flex flex-col items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className={cn(
              "w-16 h-16 rounded-full border-2 transition-all",
              isMuted ? "bg-red-500/20 border-red-500 text-red-500" : "bg-slate-800 border-slate-700 text-slate-300"
            )}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </Button>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Mute</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            size="icon"
            variant="destructive"
            onClick={handleEndCall}
            className="w-20 h-20 rounded-full shadow-lg shadow-red-500/20"
          >
            <PhoneOff size={32} />
          </Button>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">End</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={cn(
              "w-16 h-16 rounded-full border-2 transition-all",
              !isSpeakerOn ? "bg-amber-500/20 border-amber-500 text-amber-500" : "bg-slate-800 border-slate-700 text-slate-300"
            )}
          >
            {!isSpeakerOn ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </Button>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Speaker</span>
        </div>
      </footer>
    </div>
  );
}
