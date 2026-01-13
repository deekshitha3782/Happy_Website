# Microsoft Edge TTS Setup

## ✅ FREE - No API Key Required! No Billing!

Microsoft Edge TTS is **completely free** (no billing setup needed!) and provides **consistent voices across ALL devices**!

## Why Edge TTS?

- ✅ **100% FREE** - No billing, no API keys, no limits
- ✅ **Same voice everywhere** - Works on Windows, macOS, Android, iOS
- ✅ **High quality** - Uses Microsoft's neural TTS engine
- ✅ **No setup required** - Just works out of the box!

## How It Works

The app automatically uses Microsoft Edge TTS service which:
- Uses the same TTS engine as Microsoft Edge browser
- Provides consistent female voice (`en-US-AriaNeural`) across all devices
- **No setup required** - just works automatically!
- Falls back to browser TTS if Edge TTS is unavailable (shouldn't happen normally)

## Voice Details

- **Voice:** `en-US-AriaNeural` (Pleasant female voice)
- **Language:** English (US)
- **Rate:** 0.9 (Natural speaking pace)
- **Pitch:** Natural
- **Format:** MP3, 24kHz, 48kbps

## Testing

1. Open the app in your browser
2. Start a chat or voice call
3. Check browser console:
   - `☁️ Using Edge TTS (consistent voice across devices)` = Working!
   - `🌐 Using browser TTS` = Fallback (shouldn't happen normally)

## Troubleshooting

### Still using browser TTS
- Check server logs for errors
- Verify the `/api/tts` endpoint is accessible
- Edge TTS should work automatically - no configuration needed!

### Audio not playing
- Check browser console for errors
- Verify your browser supports MP3 audio playback
- Try refreshing the page

## Technical Details

The app uses Microsoft's public Edge TTS endpoint:
```
https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/tts
```

This is the same service used by Microsoft Edge browser, so it's:
- Reliable
- Fast
- Free
- No authentication required

## Comparison

| Feature | Edge TTS | Browser TTS |
|---------|----------|-------------|
| **Cost** | FREE | FREE |
| **API Key** | Not needed | Not needed |
| **Billing** | Not needed | Not needed |
| **Consistency** | ✅ Same voice everywhere | ❌ Different per device |
| **Quality** | ✅ High (neural) | ⚠️ Varies by device |

---

**That's it!** No setup required - Edge TTS works automatically! 🎉

