import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, CloudSun, HeartHandshake } from "lucide-react";
import { useMessages, useSendMessage, useClearChat } from "@/hooks/use-messages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { speakWithEdgeTTS } from "@/utils/voice";

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
  const { data: messages } = useMessages("call"); // Use "call" session type
  const { mutate: sendMessage, isPending: isSending } = useSendMessage("call"); // Use "call" session type
  const { mutate: clearChat } = useClearChat("call"); // Use "call" session type
  
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
  const wakeLockRef = useRef<any>(null); // Wake Lock to prevent screen timeout
  const currentTTSRef = useRef<(() => void) | null>(null); // Track current TTS instance to cancel if needed
  const isTTSPlayingRef = useRef<boolean>(false); // Track if TTS is currently playing
  const ttsQueueRef = useRef<Array<{ id: number; content: string }>>([]); // Queue for TTS messages

  // Detect device/browser type
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Enhanced iOS debugging (helps when testing remotely)
  useEffect(() => {
    console.log("📱 Device Detection:", {
      isIOSSafari,
      isSafari,
      isMobile,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      hasSpeechRecognition: !!(window as any).webkitSpeechRecognition || !!(window as any).SpeechRecognition,
      hasWakeLock: 'wakeLock' in navigator,
    });
  }, [isIOSSafari, isSafari, isMobile]);

  // Wake Lock API - Prevent screen timeout (like commercial AI agents)
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log("✅ Wake Lock active - screen won't timeout");
          
          // Handle wake lock release
          wakeLockRef.current.addEventListener('release', () => {
            console.log("Wake Lock released");
          });
        } catch (err: any) {
          console.log("Wake Lock not supported or failed:", err.message);
        }
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

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
            // After clearing, send initial greeting message directly
            // AI will respond with simple greeting
            setTimeout(() => {
              sendMessage(
                { role: "user", content: "start", sessionType: "call" } as any,
                {
                  onSuccess: () => {
                    // The AI will generate the initial greeting
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
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setCallStatus("Speech recognition not supported in this browser. Try Chrome or Firefox.");
      console.error("Speech Recognition API not available");
      return;
    }

    // iOS Safari: Will try to auto-start (may require user interaction)
    if (isIOSSafari && isSafari) {
      console.log("ℹ️ iOS Safari detected - attempting auto-start");
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
      
      // Set language to Indian English for better accent matching
      if (isIOSSafari || isMobile) {
        recognitionRef.current.lang = 'en-IN'; // Indian English
      } else {
        recognitionRef.current.lang = 'en-IN'; // Indian English for all devices
      }
      
      console.log("🎤 Speech recognition configured (same as chat recording):", {
        continuous: recognitionRef.current.continuous,
        interimResults: recognitionRef.current.interimResults,
        isMobile
      });

      recognitionRef.current.onstart = () => {
        setCallStatus("Connected");
        setIsListening(true);
        console.log("✅ Speech recognition started - listening continuously");
        console.log("📱 Device info:", { isMobile, isIOSSafari, isSafari, userAgent: navigator.userAgent.substring(0, 50) });
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
        // CRITICAL: NEVER restart if AI is speaking
        if (event.error !== 'aborted' && event.error !== 'not-allowed' && event.error !== 'no-speech' && !isAISpeakingRef.current) {
          setTimeout(() => {
            if (recognitionRef.current && !isMuted && !isAISpeakingRef.current) {
              try {
                recognitionRef.current.start();
                setCallStatus("Connected");
                setIsListening(true);
                console.log("Restarted recognition after error - reconnected");
              } catch (e) {
                console.log("Could not restart recognition:", e);
                setIsListening(false);
                setCallStatus("Reconnecting...");
                // Auto-retry after delay (only if AI not speaking)
                setTimeout(() => {
                  if (recognitionRef.current && !isMuted && !isAISpeakingRef.current) {
                    try {
                      recognitionRef.current.start();
                    } catch (retryError) {
                      console.log("Auto-retry failed:", retryError);
                    }
                  }
                }, 2000);
              }
            }
          }, isMobile ? 1000 : 1500);
        } else if (isAISpeakingRef.current) {
          console.log("🔇 Error occurred but AI is speaking - NOT restarting mic");
        }
      };

      // FIXED: Reliable speech recognition - use timeout to prevent hanging
      let pendingFinalTranscript = "";
      
      recognitionRef.current.onresult = (event: any) => {
        // CRITICAL: Never process results if AI is speaking - completely ignore all input
        if (isAISpeakingRef.current) {
          console.log("🔇 Ignoring ALL recognition results - AI is speaking (mic should be off)");
          // Clear any transcript that might have appeared
          setTranscript("");
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
        
        // Process final results - use timeout-based approach for reliability
        if (finalTranscript.trim()) {
          const trimmed = finalTranscript.trim();
          pendingFinalTranscript = trimmed; // Store for timeout processing
          
          // Clear any existing timeout
          if (sendTimeoutRef.current) {
            clearTimeout(sendTimeoutRef.current);
          }
          
          // Use timeout to wait for more input (prevents hanging)
          // If no more speech comes within timeout, send what we have
          sendTimeoutRef.current = setTimeout(() => {
            // Process and send the final transcript
            const toSend = pendingFinalTranscript;
            pendingFinalTranscript = ""; // Clear after processing
            
            // ECHO FILTERING: Check if this matches recent AI messages
            const trimmedLower = toSend.toLowerCase();
            const isEcho = recentAIMessagesRef.current.some(aiMsg => {
              const similarity = calculateSimilarity(trimmedLower, aiMsg);
              return similarity > 0.6;
            });
            
            if (isEcho) {
              console.log("🚫 ECHO DETECTED - Ignoring AI voice:", toSend);
              setTranscript("");
              return;
            }
            
            // Accept any input - even single words (ok, sure, thank you, etc.)
            if (toSend.length >= 1) {
              // Prevent duplicates
              if (toSend === lastSentMessageRef.current) {
                console.log("⚠️ Duplicate message ignored:", toSend);
                return;
              }
              
              // Send to AI - accept single words and phrases
              console.log("✅ Sending input to AI:", toSend);
              lastSentMessageRef.current = toSend;
              sendMessage({ role: "user", content: toSend, sessionType: "call" } as any);
              
              // Clear transcript after sending
              setTimeout(() => {
                setTranscript("");
                lastSentMessageRef.current = "";
              }, 1000);
            }
          }, isMobile ? 600 : 400); // Shorter timeout for better responsiveness
          
          console.log(`⏳ Waiting ${isMobile ? 600 : 400}ms for more input, will send: "${trimmed}"`);
        }
      };

      // Auto-restart handler - NEVER RESTART IF AI IS SPEAKING
      recognitionRef.current.onend = () => {
        // CRITICAL: NEVER restart if AI is speaking - mic must stay off
        if (isAISpeakingRef.current) {
          console.log("🔇 Recognition ended but AI is speaking - NOT restarting (mic stays off)");
          setIsListening(false);
          return; // Exit immediately - do not restart
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
                setCallStatus("Reconnecting...");
                // Auto-retry after delay
                setTimeout(() => {
                  if (recognitionRef.current && !isMuted) {
                    try {
                      recognitionRef.current.start();
                    } catch (retryError) {
                      console.log("Auto-retry failed:", retryError);
                    }
                  }
                }, 2000);
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
            // Auto-start failed - retry once
            console.log("Auto-start failed, retrying:", e.message);
            setCallStatus("Connecting...");
            setTimeout(() => {
              if (recognitionRef.current && !isMuted) {
                try {
                  recognitionRef.current.start();
                } catch (retryError: any) {
                  console.log("Retry failed:", retryError.message);
                  setCallStatus("Microphone permission needed");
                }
              }
            }, 1000);
          }
        }
      }, 500); // Simple delay - same for all devices
    };

    // Initialize on mount
    initSpeechRecognition();

    // Auto-start for all browsers (including iOS Safari - will try)
    if (!isMuted) {
      setTimeout(() => {
        if (recognitionRef.current && !isMuted) {
          try {
            recognitionRef.current.start();
            console.log("✅ Auto-starting speech recognition");
          } catch (e: any) {
            console.log("Auto-start failed:", e.message);
            setCallStatus("Connecting...");
            // Retry once after a delay (iOS may need more time)
            setTimeout(() => {
              if (recognitionRef.current && !isMuted) {
                try {
                  recognitionRef.current.start();
                } catch (retryError: any) {
                  console.log("Retry failed:", retryError.message);
                  setCallStatus("Microphone permission needed");
                }
              }
            }, 1000);
          }
        }
      }, 500);
    }

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

  // Function to process TTS queue - plays next message if queue is not empty
  const processTTSQueue = () => {
    // If already playing, don't start new one
    if (isTTSPlayingRef.current) {
      console.log("⏸️ TTS already playing - waiting for current to finish");
      return;
    }

    // Check if there's a message in queue
    if (ttsQueueRef.current.length === 0) {
      console.log("✅ TTS queue empty - all messages played");
      return;
    }

    // Get next message from queue
    const nextMessage = ttsQueueRef.current.shift();
    if (!nextMessage) return;

    console.log(`🔊 Playing queued TTS message (ID: ${nextMessage.id})`);
    
    // Store AI message to filter echo (keep last 3 AI messages)
    recentAIMessagesRef.current.push(nextMessage.content.toLowerCase());
    if (recentAIMessagesRef.current.length > 3) {
      recentAIMessagesRef.current.shift(); // Keep only last 3
    }
    
    // CRITICAL: TURN MIC OFF when AI starts speaking - FORCE STOP and PREVENT RESTART
    isAISpeakingRef.current = true; // Mark AI as speaking
    isTTSPlayingRef.current = true; // Mark TTS as playing
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort(); // Force stop completely
        setIsListening(false);
        console.log("🔇 Mic COMPLETELY OFF - AI is speaking (no input will be accepted)");
      } catch (e) {
        console.log("Could not stop recognition:", e);
      }
    }
    // Clear any pending transcripts
    setTranscript("");

    // Use Edge TTS (FREE, consistent voice) with browser TTS fallback
    speakWithEdgeTTS(
      nextMessage.content,
      () => {
        // onStart - Speech started - ensure mic is off
        isAISpeakingRef.current = true;
        isTTSPlayingRef.current = true;
        console.log("🔊 TTS started - playing message from queue");
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.stop();
            recognitionRef.current.abort();
            setIsListening(false);
          } catch (e) {
            // Ignore errors
          }
        }
      },
      () => {
        // onEnd - Speech ended - process next in queue or turn mic back on
        isTTSPlayingRef.current = false; // Mark TTS as finished
        currentTTSRef.current = null; // Clear TTS reference
        console.log("🔇 TTS finished - checking queue for next message");
        
        // Process next message in queue if any
        if (ttsQueueRef.current.length > 0) {
          console.log(`📋 Queue has ${ttsQueueRef.current.length} message(s) - playing next`);
          // Small delay before next message
          setTimeout(() => {
            processTTSQueue();
          }, 300);
        } else {
          // Queue is empty - TURN MIC BACK ON
          isAISpeakingRef.current = false; // Mark AI as finished
          console.log("✅ All TTS messages complete - mic can turn back on");
          if (recognitionRef.current && !isMuted) {
            setTimeout(() => {
              if (!isAISpeakingRef.current && recognitionRef.current && !isMuted) {
                try {
                  recognitionRef.current.start();
                  setIsListening(true);
                  console.log("🎤 Mic turned back on - all AI messages finished");
                } catch (e: any) {
                  console.log("Could not restart recognition:", e.message);
                  setCallStatus("Reconnecting...");
                  // Auto-retry after delay
                  setTimeout(() => {
                    if (recognitionRef.current && !isMuted && !isAISpeakingRef.current) {
                      try {
                        recognitionRef.current.start();
                      } catch (retryError) {
                        console.log("Auto-retry failed:", retryError);
                      }
                    }
                  }, 2000);
                }
              }
            }, 500); // Delay before restarting
          }
        }
      },
      () => {
        // onError - Speech was interrupted - process next or turn mic back on
        isTTSPlayingRef.current = false; // Mark TTS as finished
        currentTTSRef.current = null; // Clear TTS reference
        console.log("❌ TTS error - checking queue");
        
        // Process next message in queue if any
        if (ttsQueueRef.current.length > 0) {
          setTimeout(() => {
            processTTSQueue();
          }, 300);
        } else {
          // Queue is empty - TURN MIC BACK ON
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
                  // Auto-retry after delay
                  setTimeout(() => {
                    if (recognitionRef.current && !isMuted && !isAISpeakingRef.current) {
                      try {
                        recognitionRef.current.start();
                      } catch (retryError) {
                        console.log("Auto-retry failed:", retryError);
                      }
                    }
                  }, 2000);
                }
              }
            }, 500);
          }
        }
      }
    ).then((cancelFn) => {
      // Store cancel function
      currentTTSRef.current = cancelFn;
    });
  };

  // Voice Output (TTS) with queue system - ensures one voice at a time
  useEffect(() => {
    if (!isSpeakerOn || !messages) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant" && lastMessage.id !== lastReadMessageId.current) {
      // Check if this message is already in queue or currently playing
      const isAlreadyQueued = ttsQueueRef.current.some(msg => msg.id === lastMessage.id);
      const isCurrentlyPlaying = isTTSPlayingRef.current && lastReadMessageId.current === lastMessage.id;
      
      if (isAlreadyQueued || isCurrentlyPlaying) {
        console.log(`⏭️ Message ${lastMessage.id} already queued or playing - skipping`);
        return;
      }

      // Add to queue
      console.log(`📋 Adding message ${lastMessage.id} to TTS queue (queue length: ${ttsQueueRef.current.length})`);
      ttsQueueRef.current.push({
        id: lastMessage.id,
        content: lastMessage.content
      });

      // Update last read message ID
      lastReadMessageId.current = lastMessage.id;

      // Process queue (will only play if nothing is currently playing)
      processTTSQueue();
    }
  }, [messages, isSpeakerOn, isListening, isMuted]);

  // Cleanup function for TTS
  useEffect(() => {
    return () => {
      // Cancel TTS if component unmounts
      if (currentTTSRef.current) {
        console.log("🧹 Cleanup: Canceling TTS");
        currentTTSRef.current();
        currentTTSRef.current = null;
      }
      window.speechSynthesis.cancel();
      isTTSPlayingRef.current = false;
      ttsQueueRef.current = []; // Clear queue on unmount
    };
  }, []);
  
  // Monitor for user speech and interrupt AI immediately
  useEffect(() => {
    // If transcript appears (user is speaking), stop AI immediately
    if (transcript && transcript.trim().length > 0) {
      window.speechSynthesis.cancel();
      isAISpeakingRef.current = false; // User interrupted AI
    }
  }, [transcript]);


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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 font-sans overflow-hidden relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 animate-pulse" />
      
      {/* Top Info */}
      <header className="w-full flex flex-col items-center gap-2 mt-4 sm:mt-8 md:mt-12 relative z-10">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/30 to-blue-500/30 rounded-3xl flex items-center justify-center text-primary mb-2 sm:mb-3 md:mb-4 shadow-lg shadow-primary/20 backdrop-blur-sm border border-primary/20"
        >
          <CloudSun className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10" />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent"
        >
          Serenity AI
        </motion.h1>
        <motion.p 
          className={cn(
            "text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-2",
            callStatus === "Connected" ? "text-green-400" : "text-slate-400"
          )}
          animate={callStatus === "Connected" ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {callStatus === "Connected" && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-green-400 rounded-full"
            />
          )}
          {callStatus}
        </motion.p>
      </header>

      {/* Visualizer / Avatar */}
      <main className="relative flex items-center justify-center flex-1 min-h-0 w-full z-10">
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.8, 1.5], opacity: [0, 0.3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-full blur-xl"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 2.2, 2], opacity: [0, 0.2, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                className="absolute w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full blur-2xl"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.6, 1.4], opacity: [0, 0.4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                className="absolute w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 bg-primary/15 rounded-full"
              />
            </>
          )}
        </AnimatePresence>
        
        <motion.div 
          className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 bg-gradient-to-br from-primary via-blue-500 to-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 z-10 border-4 border-white/10 backdrop-blur-sm"
          animate={isListening ? { 
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 0 40px rgba(59, 130, 246, 0.3)",
              "0 0 60px rgba(59, 130, 246, 0.5)",
              "0 0 40px rgba(59, 130, 246, 0.3)"
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <HeartHandshake className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-white drop-shadow-lg" />
          {isSending && (
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-white/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}
          {isAISpeakingRef.current && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      </main>

      {/* Transcript / Subtitles */}
      <div className="w-full max-w-md text-center min-h-[60px] sm:min-h-[80px] md:min-h-[96px] flex items-center justify-center px-4 py-2 relative z-10">
        <AnimatePresence mode="wait">
          {transcript ? (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl px-4 py-3 border border-primary/20 shadow-lg"
            >
              <motion.p 
                className="text-sm sm:text-base md:text-lg text-slate-200 font-medium break-words"
              >
                "{transcript}"
              </motion.p>
            </motion.div>
          ) : isSending ? (
            <motion.div
              key="listening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.div
                className="flex gap-1"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="w-2 h-2 bg-primary rounded-full" />
                <span className="w-2 h-2 bg-primary rounded-full" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 bg-primary rounded-full" style={{ animationDelay: "0.4s" }} />
              </motion.div>
              <span className="text-slate-400 text-xs sm:text-sm tracking-widest uppercase font-bold">
                Listening...
              </span>
            </motion.div>
          ) : (
            <motion.p 
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-slate-500 text-xs sm:text-sm tracking-widest uppercase font-bold"
            >
              Speak freely
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <footer className="w-full max-w-sm grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-4 sm:mb-8 md:mb-12 px-4 relative z-10">
        <motion.div 
          className="flex flex-col items-center gap-1 sm:gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className={cn(
              "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full border-2 transition-all touch-manipulation backdrop-blur-sm shadow-lg",
              isMuted 
                ? "bg-red-500/30 border-red-500 text-red-400 shadow-red-500/20" 
                : "bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700/80 hover:border-primary/50"
            )}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tighter">Mute</span>
        </motion.div>

        <motion.div 
          className="flex flex-col items-center gap-1 sm:gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            variant="destructive"
            onClick={handleEndCall}
            className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full shadow-2xl shadow-red-500/30 touch-manipulation bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-2 border-red-400/50 backdrop-blur-sm"
          >
            <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
          </Button>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tighter">End</span>
        </motion.div>

        <motion.div 
          className="flex flex-col items-center gap-1 sm:gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={cn(
              "w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full border-2 transition-all touch-manipulation backdrop-blur-sm shadow-lg",
              !isSpeakerOn 
                ? "bg-amber-500/30 border-amber-500 text-amber-400 shadow-amber-500/20" 
                : "bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700/80 hover:border-primary/50"
            )}
          >
            {!isSpeakerOn ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tighter">Speaker</span>
        </motion.div>
      </footer>
    </div>
  );
}
