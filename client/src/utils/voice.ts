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
 * Optimized for a lively, uplifting, and energetic experience to boost mood
 */
export function configureFemaleVoice(utterance: SpeechSynthesisUtterance): void {
  const femaleVoice = getFemaleVoice();
  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }
  
  // Lively, uplifting voice settings to energize and uplift mood
  utterance.rate = 1.0;   // Normal to slightly faster for more energy and liveliness
  utterance.pitch = 1.1;  // Slightly higher pitch for a brighter, more uplifting tone
  utterance.volume = 0.95; // Clear and present but not overwhelming
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

