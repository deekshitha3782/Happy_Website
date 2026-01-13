/**
 * Generate or retrieve a unique device ID for session separation
 * Uses localStorage to persist across page reloads
 */
export function getDeviceId(): string {
  const STORAGE_KEY = 'kind-mind-device-id';
  
  // Try to get existing device ID
  let deviceId = localStorage.getItem(STORAGE_KEY);
  
  // If no device ID exists, generate a new one
  if (!deviceId) {
    // Generate a unique ID using timestamp + random
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
    console.log("🆔 Generated new device ID:", deviceId);
  } else {
    console.log("🆔 Using existing device ID:", deviceId);
  }
  
  return deviceId;
}

