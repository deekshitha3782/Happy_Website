/**
 * Generate and store a unique device ID for session separation
 * Each device/browser gets its own unique ID stored in localStorage
 */
export function getDeviceId(): string {
  const STORAGE_KEY = 'kind-mind-device-id';
  
  // Try to get existing device ID from localStorage
  try {
    const existingId = localStorage.getItem(STORAGE_KEY);
    if (existingId) {
      return existingId;
    }
  } catch (e) {
    // localStorage might not be available (private browsing, etc.)
    console.log("Could not access localStorage:", e);
  }
  
  // Generate new device ID based on browser fingerprint + timestamp
  // This ensures each device/browser gets a unique ID
  const userAgent = navigator.userAgent;
  const platform = navigator.platform || '';
  const language = navigator.language || '';
  const timestamp = Date.now();
  
  // Create a simple hash-like ID from device characteristics
  const deviceFingerprint = `${userAgent}-${platform}-${language}-${timestamp}`;
  
  // Simple hash function to create a shorter ID
  let hash = 0;
  for (let i = 0; i < deviceFingerprint.length; i++) {
    const char = deviceFingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Create readable device ID
  const deviceId = `device-${Math.abs(hash).toString(36)}-${timestamp.toString(36)}`;
  
  // Store in localStorage for persistence
  try {
    localStorage.setItem(STORAGE_KEY, deviceId);
  } catch (e) {
    // If localStorage fails, that's okay - we'll use the generated ID
    console.log("Could not store device ID in localStorage:", e);
  }
  
  console.log("📱 Generated device ID:", deviceId);
  return deviceId;
}

