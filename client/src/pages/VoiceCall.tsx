import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, CloudSun, HeartHandshake } from "lucide-react";
import { useMessages, useSendMessage, useClearChat } from "@/hooks/use-messages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { configureFemaleVoice, waitForVoices } from "@/utils/voice";

// Helper function to calculate similarity between two strings (for echo detection)
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/).filter(w => w.length > 2); // Ignore short words
  const words2 = str2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Count matching words
  const matches = words1.filter(w => words2.includes(w)).length;
  return matches / Math.max(words1.length, words2.length);
}

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
  const lastSentMessageRef = useRef<string>(""); // Prevent duplicate sends
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce sending
  const audioContextRef = useRef<AudioContext | null>(null); // Web Audio API for gain boost
  const mediaStreamRef = useRef<MediaStream | null>(null); // Keep mic stream active
  const recentAIMessagesRef = useRef<string[]>([]); // Track recent AI messages to filter echo
  const isAISpeakingRef = useRef<boolean>(false); // Track if AI is currently speaking

  // Detect device/browser type
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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

  // Initialize Speech Recognition with mobile support
  useEffect(() => {
    // Check for iOS Safari - doesn't support Web Speech API
    if (isIOSSafari && isSafari) {
      setCallStatus("iOS Safari doesn't support voice calls. Please use Chrome or Firefox on iOS.");
      console.error("iOS Safari doesn't support Web Speech API");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setCallStatus("Speech recognition not supported in this browser. Try Chrome or Firefox.");
      console.error("Speech Recognition API not available");
      return;
    }

    // SIMPLIFIED: Don't request getUserMedia separately
    // Speech recognition will request permission automatically when started
    // This is what makes chat recording work on mobile - no getUserMedia needed!
    const requestMicrophonePermission = async () => {
      // Do nothing - let speech recognition handle permission
      // This matches chat recording behavior exactly
      console.log("ℹ️ Letting speech recognition handle microphone permission (same as chat)");
    };

    const initSpeechRecognition = async () => {
      // SIMPLIFIED: Match chat recording approach - don't require getUserMedia first
      // Speech recognition will request permission automatically when started
      // This is what makes chat recording work on mobile!
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      // Don't set lang explicitly - let browser use default (works better on mobile)
      
      console.log("🎤 Speech recognition configured (same as chat recording):", {
        continuous: recognitionRef.current.continuous,
        interimResults: recognitionRef.current.interimResults,
        isMobile
      });

      recognitionRef.current.onstart = () => {
        setCallStatus("Connected");
        setIsListening(true);
        console.log("✅ Speech recognition started - listening continuously");
        console.log("📱 Device info:", { isMobile, userAgent: navigator.userAgent.substring(0, 50) });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("❌ Speech recognition error:", event.error, {
          isMobile,
          isListening,
          isMuted
        });
        if (event.error === 'no-speech') {
          // This is normal, just means no speech detected yet - don't show error
          // Keep recognition running
          console.log("ℹ️ No speech detected (normal - keep listening)");
          return;
        }
        if (event.error === 'audio-capture') {
          setCallStatus("Microphone not found");
        } else if (event.error === 'not-allowed') {
          setCallStatus("Microphone permission denied");
        } else if (event.error === 'network') {
          setCallStatus("Network error - check connection");
        } else if (event.error === 'aborted') {
          // Aborted is normal when we stop it manually
          return;
        } else {
          console.log("Recognition error (non-critical):", event.error);
          // Don't show error for minor issues, just log
        }
        
        // Try to restart if it's a recoverable error (keep connection alive)
        if (event.error !== 'aborted' && event.error !== 'not-allowed' && event.error !== 'no-speech') {
          setTimeout(() => {
            if (recognitionRef.current && !isMuted) {
              try {
                recognitionRef.current.start();
                setCallStatus("Connected");
                setIsListening(true);
                console.log("Restarted recognition after error - reconnected");
              } catch (e) {
                console.log("Could not restart recognition:", e);
                setIsListening(false);
                setCallStatus("Tap 'Start Listening' to reconnect");
              }
            }
          }, isMobile ? 1000 : 1500);
        }
      };

      // FIXED: Only send final results - wait for COMPLETE sentence (especially on mobile)
      recognitionRef.current.onresult = (event: any) => {
        // Don't process results if AI is speaking
        if (isAISpeakingRef.current) {
          console.log("🔇 Ignoring recognition results - AI is speaking");
          return;
        }
        
        let interimTranscript = "";
        let finalTranscript = "";
        
        // Separate interim and final results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript || "";
          
          if (result.isFinal) {
            // Final result - user finished speaking
            finalTranscript += transcript + " ";
          } else {
            // Interim result - user is still speaking
            interimTranscript += transcript;
          }
        }
        
        // Update transcript display (show interim while speaking, final when done)
        if (interimTranscript.trim()) {
          setTranscript(interimTranscript);
        } else if (finalTranscript.trim()) {
          setTranscript(finalTranscript.trim());
        }
        
        // Stop AI speech immediately when user speaks (even interim)
        if (interimTranscript.trim() || finalTranscript.trim()) {
          window.speechSynthesis.cancel();
          isAISpeakingRef.current = false; // User interrupted AI
        }
        
        // ONLY send final results - wait for COMPLETE sentence (especially on mobile)
        if (finalTranscript.trim()) {
          const trimmed = finalTranscript.trim();
          
          // MOBILE FIX: Ensure complete sentence (ends with punctuation or is long enough)
          // Mobile browsers sometimes mark short phrases as "final" too quickly
          const hasPunctuation = /[.!?]$/.test(trimmed);
          const isLongEnough = trimmed.length >= (isMobile ? 10 : 5); // Longer threshold on mobile
          const isCompleteSentence = hasPunctuation || isLongEnough;
          
          if (!isCompleteSentence && isMobile) {
            console.log("⏳ Waiting for complete sentence on mobile:", trimmed);
            // Don't send yet - wait for more
            return;
          }
          
          // ECHO FILTERING: Check if this matches recent AI messages
          const trimmedLower = trimmed.toLowerCase();
          const isEcho = recentAIMessagesRef.current.some(aiMsg => {
            const similarity = calculateSimilarity(trimmedLower, aiMsg);
            return similarity > 0.6;
          });
          
          if (isEcho) {
            console.log("🚫 ECHO DETECTED - Ignoring AI voice:", trimmed);
            setTranscript("");
            return;
          }
          
          // Simple validation - check it's not empty
          if (trimmed.length >= 2) {
            // Prevent duplicates
            if (trimmed === lastSentMessageRef.current) {
              console.log("⚠️ Duplicate message ignored:", trimmed);
              return;
            }
            
            // Send to AI - only final results (complete sentences)
            console.log("✅ Sending complete sentence to AI:", trimmed);
            lastSentMessageRef.current = trimmed;
            sendMessage({ role: "user", content: trimmed });
            
            // Clear transcript after sending
            setTimeout(() => {
              setTranscript("");
              lastSentMessageRef.current = "";
            }, 1000);
          }
        }
      };

      // Auto-restart handler - BUT DON'T RESTART IF AI IS SPEAKING
      recognitionRef.current.onend = () => {
        // DON'T restart if AI is speaking or if muted
        if (isAISpeakingRef.current) {
          console.log("🔇 Recognition ended but AI is speaking - NOT restarting");
          setIsListening(false);
          return;
        }
        
        // Auto-restart for continuous listening (only if AI is not speaking)
        if (!isMuted && recognitionRef.current && !isAISpeakingRef.current) {
          setTimeout(() => {
            if (recognitionRef.current && !isMuted && !isAISpeakingRef.current) {
              try {
                recognitionRef.current.start();
                setIsListening(true);
                console.log("✅ Recognition restarted (continuous listening)");
              } catch (e: any) {
                console.log("Could not auto-restart:", e.message);
                setIsListening(false);
                setCallStatus("Tap 'Start Listening' to reconnect");
              }
            }
          }, 500);
        } else {
          setIsListening(false);
        }
      };

      // SIMPLIFIED: Try to auto-start (like chat would if it auto-started)
      // If it fails on mobile, that's fine - user can click button (same as chat)
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setCallStatus("Connecting...");
            console.log("✅ Auto-starting recognition");
          } catch (e: any) {
            // Auto-start failed (common on mobile) - show button
            // This is normal and expected on mobile browsers
            console.log("Auto-start failed (normal on mobile):", e.message);
            setCallStatus("Tap 'Start Listening' to begin");
          }
        }
      }, 500); // Simple delay - same for all devices
    };

    // Initialize on mount
    initSpeechRecognition();

          return () => {
            // Complete cleanup when component unmounts or dependencies change
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
                recognitionRef.current.abort(); // Force stop
              } catch (e) {
                // Ignore errors if already stopped
              }
              recognitionRef.current = null; // Clear reference
            }
            // Stop and cleanup audio stream
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach(track => track.stop());
              mediaStreamRef.current = null;
            }
            // Close audio context
            if (audioContextRef.current) {
              audioContextRef.current.close().catch(console.error);
              audioContextRef.current = null;
            }
            // Clear any pending timeouts
            if (sendTimeoutRef.current) {
              clearTimeout(sendTimeoutRef.current);
              sendTimeoutRef.current = null;
            }
            window.speechSynthesis.cancel();
            setIsListening(false);
          };
  }, [sendMessage, isMuted]);

  // Voice Output (TTS) with consistent female voice - turn mic off when AI speaks
  useEffect(() => {
    if (!isSpeakerOn || !messages) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.id !== lastReadMessageId.current) {
      // Store AI message to filter echo (keep last 3 AI messages)
      recentAIMessagesRef.current.push(lastMessage.content.toLowerCase());
      if (recentAIMessagesRef.current.length > 3) {
        recentAIMessagesRef.current.shift(); // Keep only last 3
      }
      
      // Wait for voices to be loaded, then speak
      const cleanup = waitForVoices(() => {
        const utterance = new SpeechSynthesisUtterance(lastMessage.content);
        configureFemaleVoice(utterance);
        
        // Cancel any ongoing speech before starting new one
        window.speechSynthesis.cancel();
        
        // TURN MIC OFF when AI starts speaking - FORCE STOP
        isAISpeakingRef.current = true; // Mark AI as speaking
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            recognitionRef.current.abort(); // Force stop
            setIsListening(false);
            console.log("🔇 Mic turned off - AI is speaking");
          } catch (e) {
            console.log("Could not stop recognition:", e);
          }
        }
        
        // Add event handlers for better control
        utterance.onstart = () => {
          // Speech started - ensure mic is off
          isAISpeakingRef.current = true;
          if (recognitionRef.current && isListening) {
            try {
              recognitionRef.current.stop();
              recognitionRef.current.abort();
              setIsListening(false);
            } catch (e) {
              // Ignore errors
            }
          }
        };
        
        utterance.onend = () => {
          // Speech ended - TURN MIC BACK ON
          isAISpeakingRef.current = false; // Mark AI as finished
          if (recognitionRef.current && !isMuted) {
            setTimeout(() => {
              if (!isAISpeakingRef.current && recognitionRef.current && !isMuted) {
                try {
                  recognitionRef.current.start();
                  setIsListening(true);
                  console.log("🎤 Mic turned back on - AI finished speaking");
                } catch (e: any) {
                  console.log("Could not restart recognition:", e.message);
                  setCallStatus("Tap 'Start Listening' to reconnect");
                }
              }
            }, 500); // Delay before restarting
          }
        };
        
        utterance.onerror = () => {
          // Speech was interrupted - TURN MIC BACK ON
          isAISpeakingRef.current = false; // Mark AI as finished
          if (recognitionRef.current && !isMuted) {
            setTimeout(() => {
              if (!isAISpeakingRef.current && recognitionRef.current && !isMuted) {
                try {
                  recognitionRef.current.start();
                  setIsListening(true);
                  console.log("🎤 Mic turned back on - AI speech interrupted");
                } catch (e: any) {
                  console.log("Could not restart recognition:", e.message);
                }
              }
            }, 500);
          }
        };
        
        // Start speaking
        window.speechSynthesis.speak(utterance);
        lastReadMessageId.current = lastMessage.id;
      });

      return cleanup;
    }
  }, [messages, isSpeakerOn, isListening, isMuted]);
  
  // Monitor for user speech and interrupt AI immediately
  useEffect(() => {
    // If transcript appears (user is speaking), stop AI immediately
    if (transcript && transcript.trim().length > 0) {
      window.speechSynthesis.cancel();
      isAISpeakingRef.current = false; // User interrupted AI
    }
  }, [transcript]);

  // SIMPLIFIED: Match chat recording's toggleRecording - simple start/stop
  const handleStartListening = async () => {
    // Same simple approach as chat recording - just start recognition
    // Speech recognition will request permission automatically
    if (!recognitionRef.current) {
      setCallStatus("Speech recognition not initialized");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setCallStatus("Connecting...");
        setIsListening(true);
      } catch (e: any) {
        console.error("Failed to start:", e);
        if (e.message && e.message.includes('already started')) {
          // Already running, that's fine
          setCallStatus("Connected");
        } else {
          setCallStatus("Failed to start - check permissions");
        }
      }
    } else {
      setCallStatus("Speech recognition not initialized");
    }
  };

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
    // Completely stop and clean up speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort(); // Force stop
      } catch (e) {
        // Ignore errors if already stopped
      }
      setIsListening(false);
      recognitionRef.current = null; // Clear the reference
    }
    
    // Clear any pending timeouts
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
      sendTimeoutRef.current = null;
    }
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clear transcript
    setTranscript("");
    
    // Clear all messages from the call so they don't appear in chat
    clearChat(undefined, {
      onSuccess: () => {
        // Small delay to ensure everything is cleaned up before navigation
        setTimeout(() => {
          setLocation("/chat");
        }, 100);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 font-sans overflow-hidden">
      {/* Top Info */}
      <header className="w-full flex flex-col items-center gap-2 mt-4 sm:mt-8 md:mt-12">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-2 sm:mb-3 md:mb-4"
        >
          <CloudSun className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
        </motion.div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Serenity AI</h1>
        <p className={cn(
          "text-xs sm:text-sm font-medium transition-colors",
          callStatus === "Connected" ? "text-green-400" : "text-slate-400"
        )}>
          {callStatus}
        </p>
        {(!callStatus.includes("Connected") && 
          !callStatus.includes("iOS Safari") && 
          !callStatus.includes("not supported") &&
          (callStatus.includes("Tap") || 
           callStatus.includes("Start Listening") || 
           callStatus.includes("Failed") ||
           callStatus.includes("Connecting") ||
           callStatus.includes("permission") ||
           (isMobile && !isListening && callStatus !== "Connected"))) ? (
          <button
            onClick={handleStartListening}
            className="mt-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors touch-manipulation shadow-lg active:scale-95"
          >
            Start Listening
          </button>
        ) : null}
      </header>

      {/* Visualizer / Avatar */}
      <main className="relative flex items-center justify-center flex-1 min-h-0 w-full">
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-primary/20 rounded-full"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-primary/10 rounded-full"
              />
            </>
          )}
        </AnimatePresence>
        
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 bg-gradient-to-tr from-primary to-blue-400 rounded-full flex items-center justify-center shadow-2xl shadow-primary/20 z-10">
          <HeartHandshake className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" />
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
      <div className="w-full max-w-md text-center min-h-[60px] sm:min-h-[80px] md:min-h-[96px] flex items-center justify-center px-4 py-2">
        <AnimatePresence mode="wait">
          {transcript ? (
            <motion.p 
              key="transcript"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm sm:text-base md:text-lg text-slate-300 italic font-medium break-words"
            >
              "{transcript}"
            </motion.p>
          ) : isSending ? (
            <motion.p 
              key="listening"
              className="text-slate-500 text-xs sm:text-sm tracking-widest uppercase font-bold"
            >
              Listening...
            </motion.p>
          ) : (
            <motion.p 
              key="waiting"
              className="text-slate-500 text-xs sm:text-sm tracking-widest uppercase font-bold"
            >
              Speak freely
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <footer className="w-full max-w-sm grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-8 md:mb-12 px-4">
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className={cn(
              "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full border-2 transition-all touch-manipulation",
              isMuted ? "bg-red-500/20 border-red-500 text-red-500" : "bg-slate-800 border-slate-700 text-slate-300"
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tighter">Mute</span>
        </div>

        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <Button
            size="icon"
            variant="destructive"
            onClick={handleEndCall}
            className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full shadow-lg shadow-red-500/20 touch-manipulation"
          >
            <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
          </Button>
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tighter">End</span>
        </div>

        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={cn(
              "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full border-2 transition-all touch-manipulation",
              !isSpeakerOn ? "bg-amber-500/20 border-amber-500 text-amber-500" : "bg-slate-800 border-slate-700 text-slate-300"
            )}
          >
            {!isSpeakerOn ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tighter">Speaker</span>
        </div>
      </footer>
    </div>
  );
}
