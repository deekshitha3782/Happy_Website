# Kind Mind AI

AI-powered voice and chat assistant for mental health support.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see `env.example`)

3. Run database migrations:
```bash
npm run db:push
```

4. Start development server:
```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key (optional, falls back to Groq)
- `GROQ_API_KEY` - Groq API key (recommended)
- `YOURVOICE_API_KEY` - YourVoice.com API key for human-like TTS (optional, falls back to Google Translate TTS)
- `YOURVOICE_API_URL` - YourVoice.com API endpoint URL (optional, defaults to `https://api.yourvoice.com/v1/tts`)
- `YOURVOICE_VOICE_ID` - YourVoice.com voice ID/name (optional, defaults to `"default"`)

### Setting Up YourVoice.com TTS

1. **Get Your API Key:**
   - Sign up at [YourVoice.com](https://yourvoice.com) (or your YourVoice.com provider)
   - Navigate to your dashboard/API settings
   - Copy your API key

2. **Add to Environment Variables:**
   - **Local Development:** Add to your `.env` file:
     ```
     YOURVOICE_API_KEY=your-actual-api-key-here
     ```
   - **Render Deployment:** Add in Render dashboard:
     - Go to your service → Environment → Add Environment Variable
     - Key: `YOURVOICE_API_KEY`
     - Value: Your API key

3. **Optional Configuration:**
   - `YOURVOICE_API_URL` - If YourVoice.com uses a different endpoint
   - `YOURVOICE_VOICE_ID` - Specify a voice ID (e.g., "female-indian", "en-IN-female")
     - Check YourVoice.com documentation for available voices

4. **API Request Format:**
   The integration uses a standard REST API pattern. If YourVoice.com uses a different format, you may need to adjust the request in `server/routes.ts`:
   - Current format: POST with JSON body containing `text`, `voice`, `language`, `speed`, `pitch`, `format`
   - API key in `Authorization: Bearer {key}` header
   - Adjust based on YourVoice.com documentation

**Note:** If `YOURVOICE_API_KEY` is not set, the system will automatically fallback to Google Translate TTS (free, but less human-like).

