# YourVoice.com TTS Integration Guide

This guide will help you integrate YourVoice.com API for human-like AI voice output across all devices.

## 🎯 What This Does

- Replaces the current Google Translate TTS with YourVoice.com's human-like voices
- Works consistently across all devices (Android, iOS, Desktop)
- Maintains all existing features (phone call mode, interruptions, etc.)
- Falls back to Google Translate TTS if YourVoice.com is unavailable

## 📋 Prerequisites

1. **YourVoice.com Account**
   - Sign up at [YourVoice.com](https://yourvoice.com) (or your provider's website)
   - Get your API key from the dashboard

2. **API Documentation**
   - Have YourVoice.com API documentation ready
   - Know the endpoint URL, authentication method, and request format

## 🔧 Setup Steps

### Step 1: Get Your API Key

1. Log in to your YourVoice.com account
2. Navigate to **API Settings** or **Developer Dashboard**
3. Generate or copy your **API Key**
4. Keep it secure (you'll need it in Step 2)

### Step 2: Configure Environment Variables

#### For Local Development:

1. Create or edit `.env` file in the project root:
   ```bash
   YOURVOICE_API_KEY=your-actual-api-key-here
   ```

2. Optional: Configure custom settings:
   ```bash
   YOURVOICE_API_URL=https://api.yourvoice.com/v1/tts
   YOURVOICE_VOICE_ID=female-indian
   ```

#### For Render Deployment:

1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add:
   - **Key:** `YOURVOICE_API_KEY`
   - **Value:** Your API key
6. Click **Save Changes**
7. (Optional) Add `YOURVOICE_API_URL` and `YOURVOICE_VOICE_ID` if needed

### Step 3: Verify API Format

The integration uses a standard REST API pattern. Check if it matches YourVoice.com's format:

**Current Implementation:**
- **Method:** POST
- **URL:** `https://api.yourvoice.com/v1/tts` (or your custom URL)
- **Headers:**
  ```
  Authorization: Bearer {YOURVOICE_API_KEY}
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "text": "Hello, how are you?",
    "voice": "default",
    "language": "en-IN",
    "speed": 0.9,
    "pitch": 1.0,
    "format": "mp3"
  }
  ```
- **Response:** Audio file (MP3, WAV, etc.)

**If YourVoice.com Uses Different Format:**

You may need to adjust the code in `server/routes.ts` (around line 197-280). Common variations:

1. **Different Authentication:**
   - If API key goes in header `X-API-Key` instead of `Authorization: Bearer`:
     ```typescript
     "X-API-Key": yourVoiceApiKey
     ```

2. **Different Request Format:**
   - If they use query parameters:
     ```typescript
     const url = `${yourVoiceApiUrl}?text=${encodeURIComponent(text)}&api_key=${yourVoiceApiKey}`;
     ```

3. **Different Response Format:**
   - If they return a URL instead of audio:
     ```typescript
     const { audioUrl } = await response.json();
     const audioResponse = await fetch(audioUrl);
     const audioBuffer = await audioResponse.arrayBuffer();
     ```

### Step 4: Test the Integration

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Test TTS:**
   - Open the voice call page
   - Speak to the AI
   - Check console logs for:
     - `✅ YourVoice.com TTS success` - Working!
     - `⚠️ YourVoice.com TTS returned status` - Check API key/format
     - `❌ YourVoice.com TTS error` - See error details

3. **Check Logs:**
   - Look for `🎤 Attempting YourVoice.com TTS` in server logs
   - If you see errors, check the error message and adjust accordingly

## 🔍 Troubleshooting

### Issue: "YourVoice.com TTS failed with status 401"
**Solution:** API key is invalid or expired. Check your API key in environment variables.

### Issue: "YourVoice.com TTS failed with status 400"
**Solution:** Request format doesn't match YourVoice.com API. Check their documentation and adjust the request body in `server/routes.ts`.

### Issue: "YourVoice.com TTS returned non-audio"
**Solution:** API returned an error message instead of audio. Check the error response in server logs and adjust accordingly.

### Issue: Falls back to Google Translate TTS
**Possible Causes:**
1. `YOURVOICE_API_KEY` not set in environment variables
2. API key is set to placeholder value `"your-api-key-here"`
3. YourVoice.com API is down or unreachable
4. Request format doesn't match YourVoice.com API

**Check:**
- Verify environment variable is set correctly
- Check server logs for specific error messages
- Test YourVoice.com API directly (using curl or Postman)

### Issue: Voice doesn't sound right
**Solution:** Adjust voice settings:
- Set `YOURVOICE_VOICE_ID` to a specific voice (check YourVoice.com docs for available voices)
- Adjust `speed` and `pitch` in the request body (in `server/routes.ts`)

## 📝 Customization

### Change Voice Settings

Edit `server/routes.ts` (around line 230-240):

```typescript
const requestBody = {
  text: textToSpeak,
  voice: process.env.YOURVOICE_VOICE_ID || "female-indian", // Change voice
  language: "en-IN", // Change language
  speed: 0.85, // Slower = more natural (0.5-2.0)
  pitch: 1.0, // Higher = higher pitch (0.5-2.0)
  format: "mp3" // Audio format
};
```

### Add More Voice Options

You can add multiple voice profiles and switch between them:

```typescript
// In server/routes.ts
const voiceProfiles = {
  calm: { voice: "female-calm", speed: 0.8, pitch: 0.95 },
  energetic: { voice: "female-energetic", speed: 1.1, pitch: 1.05 },
  default: { voice: "default", speed: 0.9, pitch: 1.0 }
};

const profile = voiceProfiles[process.env.YOURVOICE_VOICE_PROFILE || "default"];
```

## ✅ Success Indicators

When everything is working correctly, you should see:

1. **Server Logs:**
   ```
   🎤 Attempting YourVoice.com TTS for text: ...
   ✅ YourVoice.com TTS success: 12345 bytes
   ```

2. **Browser Console:**
   ```
   ☁️ Using cloud TTS (consistent voice across devices)
   ```

3. **User Experience:**
   - AI voice sounds more human-like
   - Same voice across all devices
   - Natural speech patterns

## 🚀 Next Steps

1. **Test on Multiple Devices:**
   - Android phone
   - iPhone/iPad
   - Desktop browser
   - Verify voice consistency

2. **Optimize Voice Settings:**
   - Adjust speed/pitch for best natural sound
   - Try different voice IDs if available

3. **Monitor Usage:**
   - Check YourVoice.com dashboard for API usage
   - Monitor costs if on a paid plan

## 📞 Support

If you encounter issues:

1. **Check YourVoice.com Documentation:**
   - Verify API endpoint URL
   - Check authentication method
   - Review request/response format

2. **Review Server Logs:**
   - Look for specific error messages
   - Check HTTP status codes
   - Review response content

3. **Test API Directly:**
   - Use curl or Postman to test YourVoice.com API
   - Compare with our implementation
   - Adjust code accordingly

## 🔄 Fallback Behavior

If YourVoice.com API fails or is not configured:
- System automatically falls back to Google Translate TTS
- Then falls back to browser TTS (device-specific)
- No interruption to user experience

This ensures your app always works, even if YourVoice.com is temporarily unavailable.

