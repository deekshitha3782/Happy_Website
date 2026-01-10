# Free Groq LLM API Setup

Your app now uses **Groq** - a completely free LLM API that gives you real AI responses without any billing!

## How to Get Your Free Groq API Key

1. **Visit Groq Console**: Go to https://console.groq.com/keys

2. **Sign Up** (it's free):
   - Click "Sign Up" or "Get Started"
   - Use your email or GitHub account
   - No credit card required!

3. **Create API Key**:
   - Once logged in, go to "API Keys" section
   - Click "Create API Key"
   - Give it a name (e.g., "Kind-Mind-AI")
   - Copy the key (it starts with `gsk_...`)

4. **Add to Render**:
   - Go to your Render dashboard
   - Select your `kind-mind-ai` service
   - Go to "Environment" tab
   - Click "Add Environment Variable"
   - Key: `GROQ_API_KEY`
   - Value: Paste your Groq API key
   - Click "Save Changes"

5. **Redeploy** (optional):
   - Render will automatically redeploy when you save the environment variable
   - Or manually trigger a redeploy from the "Manual Deploy" menu

## That's It! 🎉

Your app will now use Groq's free LLM for intelligent, context-aware responses. No billing, no limits (within reasonable usage), completely free!

## How It Works

The app tries APIs in this order:
1. **OpenAI** (if you have a paid key) → Best quality
2. **Groq** (free) → Fast, intelligent responses
3. **Hardcoded fallback** → Only if both APIs fail

## Benefits of Groq

- ✅ **100% Free** - No billing required
- ✅ **Very Fast** - Responses in milliseconds
- ✅ **High Quality** - Uses Llama 3.1 70B model
- ✅ **No Rate Limits** - Within reasonable usage
- ✅ **Easy Setup** - Just add one environment variable

## Troubleshooting

If Groq doesn't work:
- Make sure you copied the full API key (starts with `gsk_`)
- Check that the environment variable is set correctly in Render
- Wait a few minutes after adding the key for it to propagate
- Check Render logs for any error messages

