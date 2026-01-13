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
  
  // Priority list - try to find the same voice name across devices
  // These are common female voices that exist on multiple platforms
  // Order matters: try most common/available first
  const preferredVoices = [
    "Google US English Female",      // Chrome/Android (most common)
    "Google UK English Female",      // Chrome/Android
    "Microsoft Zira",               // Windows (very common)
    "Microsoft Hazel",              // Windows
    "Samantha",                      // macOS (very common)
    "Karen",                         // macOS
    "Moira",                         // macOS
    "Tessa",                         // macOS
    "Victoria",                      // macOS
  ];
  
  let selectedVoice: SpeechSynthesisVoice | null = null;
  
  // First, try to find a preferred voice by exact name match
  for (const preferredName of preferredVoices) {
    const voice = voices.find(v => v.name === preferredName);
    if (voice) {
      selectedVoice = voice;
      console.log(`✅ Using preferred voice: ${voice.name} (${voice.lang || 'unknown lang'})`);
      break;
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
  }
  
  // CONSISTENT voice settings across all devices
  // These settings help make voices sound more similar even if they're different voices
  utterance.rate = 0.9;   // Natural, pleasant speaking rate (not fast-forwarded)
  utterance.pitch = 1.0;  // Same pitch on all devices
  utterance.volume = 0.95; // Same volume on all devices
  
  console.log(`🎤 Voice configured: ${selectedVoice?.name || 'default'}, rate: ${utterance.rate}, pitch: ${utterance.pitch}, volume: ${utterance.volume}`);
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
    
    // Store as current instance
    currentAudioInstance = audio;

    let cancelled = false;

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
      if (!cancelled && onError) {
        onError(new Error("Audio playback failed"));
      }
    };

    audio.play().catch((error) => {
      if (currentAudioInstance === audio) {
        currentAudioInstance = null; // Clear reference on play error
      }
      if (!cancelled && onError) {
        onError(error);
      }
    });

    // Return cancel function
    return () => {
      cancelled = true;
      audio.pause();
      audio.currentTime = 0;
      URL.revokeObjectURL(audioUrl);
      if (currentAudioInstance === audio) {
        currentAudioInstance = null; // Clear reference when cancelled
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

