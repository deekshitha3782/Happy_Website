/**
 * Get a consistent female voice for text-to-speech across all devices
 * Prioritizes female voices and ensures consistent experience
 */
export function getFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) {
    return null;
  }

  // Priority list of female voice patterns (most reliable first)
  const femalePatterns = [
    /female/i,
    /woman/i,
    /zira/i,           // Windows female voice
    /samantha/i,       // macOS female voice
    /karen/i,          // macOS female voice
    /moira/i,          // macOS female voice
    /tessa/i,          // macOS female voice
    /victoria/i,       // macOS female voice
    /google uk english female/i,
    /google us english female/i,
    /microsoft zira/i,
    /microsoft hazel/i, // UK female
    /google.*female/i,
    /en-us.*female/i,
    /en-gb.*female/i,
  ];

  // Try to find a voice matching female patterns
  for (const pattern of femalePatterns) {
    const voice = voices.find(v => pattern.test(v.name));
    if (voice) {
      return voice;
    }
  }

  // Fallback: Look for voices that might be female based on name
  const possibleFemale = voices.find(v => {
    const name = v.name.toLowerCase();
    return name.includes('female') || 
           name.includes('woman') || 
           name.includes('zira') ||
           name.includes('samantha') ||
           name.includes('karen');
  });

  if (possibleFemale) {
    return possibleFemale;
  }

  // Last resort: Prefer voices that are not obviously male
  // Avoid common male voice names
  const malePatterns = [/david/i, /mark/i, /alex/i, /daniel/i, /james/i, /john/i];
  const nonMaleVoice = voices.find(v => {
    const name = v.name.toLowerCase();
    return !malePatterns.some(pattern => pattern.test(name));
  });

  return nonMaleVoice || voices[0];
}

/**
 * Configure a SpeechSynthesisUtterance with consistent female voice settings
 * Optimized for a soothing, pleasant, and calming experience for depressed users
 * 
 * NOTE: Voices will still differ across devices because Web Speech API uses
 * the device's built-in TTS voices. Different OS/browsers have different voices:
 * - Windows: Microsoft Zira, Microsoft Hazel
 * - macOS: Samantha, Karen, Moira
 * - Chrome/Android: Google US English Female
 * - iOS: Limited voices
 * 
 * To get the SAME voice everywhere, use a cloud TTS service (Google Cloud TTS, Amazon Polly, Azure TTS)
 */
export function configureFemaleVoice(utterance: SpeechSynthesisUtterance): void {
  // ALWAYS get fresh voice list to ensure consistency
  const voices = window.speechSynthesis.getVoices();
  
  // Priority list - try to find Indian English voices first, then fallback to others
  // These are common female voices that exist on multiple platforms
  // Order matters: try Indian English first, then others
  const preferredVoices = [
    "Google India English Female",   // Chrome/Android - Indian accent
    "Google IN English Female",      // Chrome/Android - Indian accent variant
    "Microsoft Ravi",                // Windows - Indian English (if available)
    "Google US English Female",      // Chrome/Android (fallback)
    "Google UK English Female",      // Chrome/Android (fallback)
    "Microsoft Zira",               // Windows (fallback)
    "Microsoft Hazel",              // Windows (fallback)
    "Samantha",                      // macOS (fallback)
    "Karen",                         // macOS (fallback)
    "Moira",                         // macOS (fallback)
    "Tessa",                         // macOS (fallback)
    "Victoria",                      // macOS (fallback)
  ];
  
  let selectedVoice: SpeechSynthesisVoice | null = null;
  
  // First, try to find voices with Indian English language code (en-IN)
  const indianVoices = voices.filter(v => 
    v.lang && (v.lang.toLowerCase() === 'en-in' || v.lang.toLowerCase().includes('in'))
  );
  
  if (indianVoices.length > 0) {
    // Prefer female Indian voices
    const indianFemaleVoice = indianVoices.find(v => 
      /female|woman|zira|ravi/i.test(v.name)
    ) || indianVoices[0];
    
    if (indianFemaleVoice) {
      selectedVoice = indianFemaleVoice;
      console.log(`✅ Found Indian English voice: ${indianFemaleVoice.name} (${indianFemaleVoice.lang})`);
    }
  }
  
  // If no Indian voice found, try preferred voices by exact name match
  if (!selectedVoice) {
    for (const preferredName of preferredVoices) {
      const voice = voices.find(v => v.name === preferredName);
      if (voice) {
        selectedVoice = voice;
        console.log(`✅ Using preferred voice: ${voice.name} (${voice.lang || 'unknown lang'})`);
        break;
      }
    }
  }
  
  // If no preferred voice found, use getFemaleVoice() fallback
  if (!selectedVoice) {
    selectedVoice = getFemaleVoice();
    if (selectedVoice) {
      console.log(`⚠️ Using fallback female voice: ${selectedVoice.name} (device-specific, may differ from other devices)`);
    }
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    // Set language to Indian English if voice supports it
    if (selectedVoice.lang) {
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'en-IN'; // Default to Indian English
    }
  } else {
    utterance.lang = 'en-IN'; // Default to Indian English if no voice selected
  }
  
  // CALMER, SMOOTHER, SWEETER voice settings
  // Optimized for a gentle, soothing, emotionally supportive experience
  utterance.rate = 0.75;   // Slower rate = calmer, more soothing (was 0.9)
  utterance.pitch = 0.95;  // Slightly lower pitch = sweeter, more gentle (was 1.0)
  utterance.volume = 0.9;   // Slightly softer volume = more calming (was 0.95)
  
  console.log(`🎤 Voice configured: ${selectedVoice?.name || 'default'} (${utterance.lang}), rate: ${utterance.rate}, pitch: ${utterance.pitch}, volume: ${utterance.volume} - Calm & Sweet`);
}

/**
 * Wait for voices to be loaded, then get female voice
 * This is needed because voices might not be available immediately
 */
export function waitForVoices(callback: () => void): () => void {
  const voices = window.speechSynthesis.getVoices();
  
  // If voices are already loaded, call callback immediately
  if (voices.length > 0) {
    callback();
    return () => {}; // Return no-op cleanup function
  }

  let called = false;
  const executeCallback = () => {
    if (!called) {
      called = true;
      callback();
    }
  };

  // Handle voiceschanged event (it's a property, not an event listener)
  const originalOnVoicesChanged = (window.speechSynthesis as any).onvoiceschanged;
  (window.speechSynthesis as any).onvoiceschanged = () => {
    executeCallback();
    if (originalOnVoicesChanged) {
      originalOnVoicesChanged();
    }
  };
  
  // Also try to get voices after a short delay (some browsers need this)
  const timeoutId = setTimeout(executeCallback, 100);

  // Return cleanup function
  return () => {
    clearTimeout(timeoutId);
    if (originalOnVoicesChanged) {
      (window.speechSynthesis as any).onvoiceschanged = originalOnVoicesChanged;
    } else {
      delete (window.speechSynthesis as any).onvoiceschanged;
    }
  };
}

// Global reference to current audio instance (for tracking only, not canceling)
let currentAudioInstance: HTMLAudioElement | null = null;

/**
 * Speak text using Microsoft Edge TTS (consistent voice) or fallback to browser TTS
 * Edge TTS is FREE and provides the SAME voice across all devices - no API key needed!
 * 
 * @param text - Text to speak
 * @param onStart - Callback when speech starts
 * @param onEnd - Callback when speech ends
 * @param onError - Callback on error
 * @returns Function to cancel speech
 */
export async function speakWithEdgeTTS(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  try {
    // Note: We don't cancel previous audio here - let it finish naturally
    // The queue system in VoiceCall.tsx ensures only one plays at a time
    
    // iOS Chrome detection - Audio element is unreliable on iOS Chrome
    // Prefer browser TTS for iOS Chrome to ensure audio is heard
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isIOSChrome = isIOS && /CriOS|Chrome/.test(navigator.userAgent);
    
    // For iOS Chrome, use browser TTS directly (more reliable than Audio element)
    if (isIOSChrome) {
      console.log("📱 iOS Chrome detected - using browser TTS for reliable audio playback");
      return speakWithBrowserTTS(text, onStart, onEnd, onError);
    }
    
    // Try Edge TTS first (FREE, no API key needed!)
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    // If API says to use browser TTS, fall back
    if (data.useBrowserTTS || !data.audioContent) {
      console.log("🌐 Using browser TTS (cloud TTS unavailable, using device-specific voice)");
      return speakWithBrowserTTS(text, onStart, onEnd, onError);
    }

    // Use cloud TTS audio (consistent voice across all devices!)
    console.log("☁️ Using cloud TTS (consistent voice across devices - FREE!)");
    
    // Decode base64 audio
    const audioData = atob(data.audioContent);
    const audioArray = new Uint8Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      audioArray[i] = audioData.charCodeAt(i);
    }

    // Create audio blob and play
    const audioBlob = new Blob([audioArray], { type: "audio/mp3" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // iOS detection (Safari, Chrome, etc.)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isIOSChrome = isIOS && /CriOS|Chrome/.test(navigator.userAgent);
    
    // Set audio properties for iOS compatibility
    audio.preload = "auto";
    audio.volume = 1.0; // Ensure full volume on iOS
    
    // iOS-specific settings for reliable playback through speaker
    if (isIOS) {
      // iOS requires these settings for reliable playback
      (audio as any).webkitAudioContext = true;
      
      // For iOS Chrome specifically, ensure audio plays through speaker
      if (isIOSChrome) {
        // Set playsInline to false to allow full-screen audio (important for speaker output)
        (audio as any).playsInline = false;
        // Ensure audio is not muted
        audio.muted = false;
        // Set volume explicitly
        audio.volume = 1.0;
      }
    }
    
    // Store as current instance
    currentAudioInstance = audio;

    let cancelled = false;
    let playAttempted = false;

    // Load audio first (required for iOS)
    // For iOS Chrome, we need to ensure audio context is active
    if (isIOSChrome) {
      // Create a user interaction context for iOS Chrome
      // This helps ensure audio plays through speaker
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          // Resume audio context if suspended (iOS requirement)
          if (audioContext.state === 'suspended') {
            audioContext.resume().catch((e) => {
              console.log("Could not resume audio context:", e);
            });
          }
        }
      } catch (e) {
        console.log("AudioContext not available:", e);
      }
    }
    
    audio.load();

    audio.onplay = () => {
      if (!cancelled && onStart) onStart();
    };

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (currentAudioInstance === audio) {
        currentAudioInstance = null; // Clear reference when done
      }
      if (!cancelled && onEnd) onEnd();
    };

    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl);
      if (currentAudioInstance === audio) {
        currentAudioInstance = null; // Clear reference on error
      }
      console.error("❌ Audio playback error:", e);
      if (!cancelled && onError) {
        onError(new Error("Audio playback failed"));
      }
    };

    // iOS-specific: Wait for canplaythrough event before playing
    let browserTTSCancel: (() => void) | null = null;
    let usingBrowserTTS = false;
    
    const playAudio = async () => {
      if (playAttempted || cancelled) return;
      playAttempted = true;
      
      // For iOS Chrome, ensure audio context is active before playing
      if (isIOSChrome) {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
              console.log("✅ iOS Chrome: Audio context resumed");
            }
          }
        } catch (e) {
          console.log("Could not resume audio context:", e);
        }
        
        // Ensure volume is set to maximum for iOS Chrome
        audio.volume = 1.0;
        audio.muted = false;
      }
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("✅ Audio playing successfully on iOS Chrome");
          // Double-check volume after play starts
          if (isIOSChrome) {
            audio.volume = 1.0;
            audio.muted = false;
          }
        }).catch((error) => {
          console.error("❌ Audio play() failed:", error);
          if (currentAudioInstance === audio) {
            currentAudioInstance = null;
          }
          // iOS might block autoplay - fallback to browser TTS
          // For iOS Chrome, be more aggressive about falling back to browser TTS
          if (isIOS && (error.name === 'NotAllowedError' || error.name === 'NotSupportedError' || isIOSChrome)) {
            console.log(`🔄 iOS ${isIOSChrome ? 'Chrome' : ''} audio blocked/failed, falling back to browser TTS`);
            URL.revokeObjectURL(audioUrl);
            if (currentAudioInstance === audio) {
              currentAudioInstance = null;
            }
            // Fallback to browser TTS immediately (async, but we'll handle it)
            usingBrowserTTS = true;
            speakWithBrowserTTS(text, onStart, onEnd, onError).then((cancelFn) => {
              browserTTSCancel = cancelFn;
              console.log("✅ iOS Chrome: Using browser TTS successfully");
            }).catch((err) => {
              console.error("Browser TTS also failed:", err);
              if (!cancelled && onError) {
                onError(err);
              }
            });
          } else if (!cancelled && onError) {
            onError(error);
          }
        });
      }
    };

    // For iOS, wait for audio to be ready
    if (isIOS) {
      // iOS Chrome needs special handling - try multiple events
      if (isIOSChrome) {
        // Try canplaythrough first
        audio.addEventListener('canplaythrough', () => {
          console.log("📱 iOS Chrome: Audio can play through");
          playAudio();
        }, { once: true });
        
        // Also try loadeddata as fallback
        audio.addEventListener('loadeddata', () => {
          console.log("📱 iOS Chrome: Audio data loaded");
          if (!playAttempted && !cancelled) {
            setTimeout(() => playAudio(), 50);
          }
        }, { once: true });
        
        // Fallback: try playing after a delay
        setTimeout(() => {
          if (!playAttempted && !cancelled) {
            console.log("📱 iOS Chrome: Attempting delayed play");
            playAudio();
          }
        }, 200);
      } else {
        // Regular iOS Safari handling
        audio.addEventListener('canplaythrough', playAudio, { once: true });
        // Fallback: try playing after a short delay
        setTimeout(() => {
          if (!playAttempted && !cancelled) {
            playAudio();
          }
        }, 100);
      }
    } else {
      // For other browsers, play immediately
      playAudio();
    }

    // Return cancel function
    return () => {
      cancelled = true;
      if (usingBrowserTTS && browserTTSCancel) {
        browserTTSCancel();
        browserTTSCancel = null;
      } else if (!usingBrowserTTS) {
        audio.pause();
        audio.currentTime = 0;
        URL.revokeObjectURL(audioUrl);
        if (currentAudioInstance === audio) {
          currentAudioInstance = null; // Clear reference when cancelled
        }
      }
    };

  } catch (error) {
    console.error("Edge TTS error, falling back to browser TTS:", error);
    // Fallback to browser TTS on error
    return speakWithBrowserTTS(text, onStart, onEnd, onError);
  }
}

/**
 * Speak text using browser's built-in TTS (device-specific voices)
 * Fallback when Google Cloud TTS is not available
 */
function speakWithBrowserTTS(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): () => void {
  // Note: We don't cancel previous speech here - let it finish naturally
  // The queue system in VoiceCall.tsx ensures only one plays at a time
  
  const utterance = new SpeechSynthesisUtterance(text);
  configureFemaleVoice(utterance);

  if (onStart) {
    utterance.onstart = onStart;
  }

  if (onEnd) {
    utterance.onend = onEnd;
  }

  if (onError) {
    utterance.onerror = (event) => {
      onError(new Error("Speech synthesis failed"));
    };
  }

  window.speechSynthesis.speak(utterance);

  // Return cancel function
  return () => {
    window.speechSynthesis.cancel();
  };
}

