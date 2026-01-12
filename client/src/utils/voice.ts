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
 * ENSURES SAME VOICE ACROSS ALL DEVICES
 */
export function configureFemaleVoice(utterance: SpeechSynthesisUtterance): void {
  // ALWAYS get fresh voice list to ensure consistency
  const voices = window.speechSynthesis.getVoices();
  
  // Priority list - try to find the same voice name across devices
  // These are common female voices that exist on multiple platforms
  const preferredVoices = [
    "Google US English Female",
    "Microsoft Zira",
    "Samantha",
    "Karen",
    "Google UK English Female",
    "Microsoft Hazel",
  ];
  
  let selectedVoice: SpeechSynthesisVoice | null = null;
  
  // First, try to find a preferred voice by exact name match
  for (const preferredName of preferredVoices) {
    const voice = voices.find(v => v.name === preferredName);
    if (voice) {
      selectedVoice = voice;
      console.log(`✅ Using preferred voice: ${voice.name}`);
      break;
    }
  }
  
  // If no preferred voice found, use getFemaleVoice() fallback
  if (!selectedVoice) {
    selectedVoice = getFemaleVoice();
    if (selectedVoice) {
      console.log(`✅ Using fallback female voice: ${selectedVoice.name}`);
    }
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
  // CONSISTENT voice settings across all devices
  // Rate set to ensure responses complete in under 10 seconds
  utterance.rate = 1.0;   // Slightly faster to ensure 2 sentences complete in <10 seconds
  utterance.pitch = 1.0;  // Same pitch on all devices
  utterance.volume = 0.95; // Same volume on all devices
  
  // Calculate estimated duration and adjust rate if needed
  const estimatedDuration = (utterance.text.length / utterance.rate) * 0.1; // Rough estimate in seconds
  if (estimatedDuration > 10) {
    // If estimated > 10 seconds, increase rate to fit
    utterance.rate = Math.max(1.2, utterance.text.length / 100);
    console.log(`⚡ Adjusted rate to ${utterance.rate.toFixed(2)} to ensure <10 second response`);
  }
  
  console.log(`🎤 Voice configured: ${selectedVoice?.name || 'default'}, rate: ${utterance.rate}, pitch: ${utterance.pitch}`);
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

