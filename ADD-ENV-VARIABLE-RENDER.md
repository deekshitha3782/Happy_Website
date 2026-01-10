# How to Add Environment Variable in Render - Step by Step

## Method 1: Through Render Dashboard (Easiest)

### Step-by-Step Instructions:

1. **Open Render Dashboard**
   - Go to: **https://dashboard.render.com**
   - Log in with your account

2. **Find Your Web Service**
   - Look for your service (probably named "kind-mind-ai" or similar)
   - Click on the service name to open it
   - OR go to: https://dashboard.render.com/web and click your service

3. **Navigate to Environment Tab**
   - In your service page, look at the top menu/tabs
   - You'll see tabs like: "Logs", "Metrics", "Environment", "Settings", etc.
   - Click on **"Environment"** tab

4. **Add the Environment Variable**
   - Scroll down to find the **"Environment Variables"** section
   - You'll see a list of existing variables (like `DATABASE_URL`, `NODE_ENV`, etc.)
   - Click the **"Add Environment Variable"** button (usually blue/green button)

5. **Enter the Details**
   - **Key**: Type exactly: `GROQ_API_KEY`
   - **Value**: Paste your Groq API key (starts with `gsk_...`)
   - Make sure there are NO spaces before or after the key
   - Click **"Save Changes"** or **"Add"** button

6. **Wait for Redeploy**
   - Render will automatically start redeploying
   - You'll see a notification or the status will change to "Deploying..."
   - Wait 2-3 minutes until it says "Live" ✅

## Visual Guide (Text-Based)

```
┌─────────────────────────────────────┐
│  Render Dashboard                   │
│  ┌───────────────────────────────┐ │
│  │ Your Services                  │ │
│  │  • kind-mind-ai (Web Service) │ │ ← Click this
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  kind-mind-ai Service                │
│  ┌────────────────────────────────┐ │
│  │ [Logs] [Metrics] [Environment]│ │ ← Click "Environment"
│  │         [Settings] [Events]    │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Environment Variables               │
│  ┌────────────────────────────────┐ │
│  │ DATABASE_URL: postgres://...   │ │
│  │ NODE_ENV: production           │ │
│  │ PORT: 10000                    │ │
│  │                                 │ │
│  │ [+ Add Environment Variable]   │ │ ← Click this button
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Add Environment Variable            │
│  ┌────────────────────────────────┐ │
│  │ Key:   [GROQ_API_KEY        ]  │ │ ← Type this
│  │ Value: [gsk_xxxxxxxxxxxxx...]  │ │ ← Paste your key
│  │                                 │ │
│  │        [Cancel] [Save Changes] │ │ ← Click Save
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Method 2: Through render.yaml (Alternative)

If you prefer to manage it in code:

1. **Open `render.yaml` file** in your project
2. **Add the environment variable**:

```yaml
services:
  - type: web
    name: kind-mind-ai
    env: node
    buildCommand: NODE_ENV=development npm install && npm run build
    startCommand: node dist/index.cjs
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: AI_INTEGRATIONS_OPENAI_API_KEY
        sync: false
      - key: GROQ_API_KEY          # ← Add this
        sync: false                # ← Add this
      - key: PORT
        value: 10000
    healthCheckPath: /
```

3. **Commit and push**:
   ```bash
   git add render.yaml
   git commit -m "Add GROQ_API_KEY to render.yaml"
   git push origin main
   ```

4. **Then set the value in Render Dashboard** (Method 1, steps 1-5)

## Important Notes:

⚠️ **Key Name Must Be Exact**: `GROQ_API_KEY` (all caps, underscores, no spaces)

⚠️ **Value**: Your Groq API key from https://console.groq.com/keys (starts with `gsk_`)

⚠️ **No Quotes**: Don't put quotes around the value, just paste the key directly

⚠️ **Sync: false**: This means you set the value in Render dashboard, not in the file

## Troubleshooting:

**Can't find "Environment" tab?**
- Make sure you're in a **Web Service**, not a Database
- The Environment tab is only in Web Services

**Button not working?**
- Try refreshing the page
- Make sure you're logged in
- Check if your service is active

**Variable not working after adding?**
- Wait 3-5 minutes for redeploy to complete
- Check the "Logs" tab to see if there are errors
- Verify the key is correct (starts with `gsk_`)
- Make sure there are no extra spaces

**How to verify it's set?**
- Go to Environment tab
- Look for `GROQ_API_KEY` in the list
- The value will be hidden (shows as `••••••••`)
- If you see it there, it's set correctly!

## Quick Checklist:

- [ ] Got Groq API key from https://console.groq.com/keys
- [ ] Opened Render Dashboard
- [ ] Clicked on my Web Service
- [ ] Clicked "Environment" tab
- [ ] Clicked "Add Environment Variable"
- [ ] Entered Key: `GROQ_API_KEY`
- [ ] Entered Value: (pasted my Groq key)
- [ ] Clicked "Save Changes"
- [ ] Waited for redeploy (2-3 minutes)
- [ ] Tested the chat - got real LLM responses! ✅

## Need Help?

If you're stuck, check:
- Render logs (Logs tab) for error messages
- Make sure the service is "Live" (not "Deploying" or "Failed")
- Verify the API key is correct in Groq console

