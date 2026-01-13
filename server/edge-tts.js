/**
 * Edge TTS wrapper using Python subprocess
 * This is more reliable than trying to use the REST API directly
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

/**
 * Generate speech using edge-tts Python package
 * @param {string} text - Text to convert to speech
 * @returns {Promise<Buffer>} Audio buffer (MP3 format)
 */
export async function generateEdgeTTS(text) {
  try {
    // Create temporary file for output
    const outputFile = join(tmpdir(), `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`);
    
    // Use edge-tts CLI (requires: pip install edge-tts)
    // Voice: en-US-AriaNeural (pleasant female voice)
    const command = `edge-tts --voice en-US-AriaNeural --rate "+0%" --text "${text.replace(/"/g, '\\"')}" --write "${outputFile}"`;
    
    console.log("🔊 Running edge-tts command...");
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes("INFO:")) {
      console.warn("⚠️ Edge TTS stderr:", stderr);
    }
    
    // Read the generated audio file
    const fs = await import("fs/promises");
    const audioBuffer = await fs.readFile(outputFile);
    
    // Clean up temp file
    await unlink(outputFile).catch(() => {});
    
    console.log("✅ Edge TTS generated audio:", audioBuffer.length, "bytes");
    return audioBuffer;
    
  } catch (error) {
    console.error("❌ Edge TTS generation error:", error);
    throw error;
  }
}

