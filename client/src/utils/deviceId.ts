/**
 * Generate or retrieve a unique device ID
 * Uses localStorage to persist the ID across sessions
 * Each device gets its own unique ID
 */
export function getDeviceId(): string {
  const STORAGE_KEY = 'kind-mind-device-id';
  
  // Try to get existing ID from localStorage
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  if (!deviceId) {
    // Generate a new unique ID
    // Format: timestamp-randomstring
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    deviceId = `${timestamp}-${random}`;
    
    // Store in localStorage for persistence
    localStorage.setItem(STORAGE_KEY, deviceId);
    console.log("🆔 Generated new device ID:", deviceId);
  } else {
    console.log("🆔 Using existing device ID:", deviceId);
  }
  
  return deviceId;
}

