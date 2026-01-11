# Troubleshooting: Still Getting Default Messages

If you've added the `GROQ_API_KEY` but still getting hardcoded responses, follow these steps:

## Step 1: Verify Environment Variable in Render

1. **Go to Render Dashboard** → Your Service → **Environment** tab
2. **Check if `GROQ_API_KEY` exists** in the list
3. **Verify the value**:
   - Should start with `gsk_`
   - Should be about 50-60 characters long
   - No spaces before or after
   - No quotes around it

## Step 2: Check Render Logs

1. **Go to Render Dashboard** → Your Service → **Logs** tab
2. **Look for these messages**:

### ✅ Good Signs (Groq is working):
```
✅ Groq client initialized successfully
POST /api/messages - Calling Groq API (free LLM)...
✅ POST /api/messages - Groq response received, length: XXX
```

### ⚠️ Warning Signs (Groq not working):
```
⚠️ WARNING: GROQ_API_KEY not set
⚠️ WARNING: Groq client is null
🔍 DEBUG: Environment check at request time: { groqApiKeyExists: false }
```

### ❌ Error Signs (Groq API failing):
```
❌ Groq API error: { message: "...", status: 401 }
❌ Groq API error: { message: "...", status: 429 }
```

## Step 3: Common Issues & Fixes

### Issue 1: Environment Variable Not Set
**Symptoms**: Logs show `groqApiKeyExists: false`

**Fix**:
1. Double-check you added `GROQ_API_KEY` (exact spelling, all caps)
2. Make sure you clicked "Save Changes"
3. Wait 3-5 minutes for redeploy to complete
4. Check the service status is "Live" (not "Deploying")

### Issue 2: Invalid API Key
**Symptoms**: Logs show `Groq API error: { status: 401 }`

**Fix**:
1. Go to https://console.groq.com/keys
2. Verify your API key is active
3. Create a new API key if needed
4. Update the value in Render Environment tab
5. Wait for redeploy

### Issue 3: API Key Not Loaded
**Symptoms**: Logs show Groq client is null even though key exists

**Fix**:
1. **Manual Redeploy**: 
   - Go to Render Dashboard → Your Service
   - Click "Manual Deploy" → "Clear build cache & deploy"
   - Wait for deployment to complete

2. **Verify Variable**:
   - Check Environment tab again
   - Make sure `GROQ_API_KEY` is there
   - Try removing and re-adding it

### Issue 4: Rate Limit or Quota
**Symptoms**: Logs show `Groq API error: { status: 429 }`

**Fix**:
- Groq free tier has rate limits
- Wait a few minutes and try again
- The app will fall back to other free APIs automatically

## Step 4: Test the Fix

1. **Send a test message** in your chat
2. **Check the logs** immediately after
3. **Look for**:
   - `✅ POST /api/messages - Groq response received`
   - The response should be different from hardcoded ones

## Step 5: Verify API Key Format

Your Groq API key should look like:
```
gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Common mistakes**:
- ❌ `GROQ_API_KEY = "gsk_..."` (with quotes)
- ❌ `groq_api_key` (wrong case)
- ❌ `GROQ_API_KEY ` (with trailing space)
- ✅ `GROQ_API_KEY` = `gsk_...` (correct)

## Step 6: Force Restart

If nothing works:

1. **Remove the environment variable**:
   - Environment tab → Find `GROQ_API_KEY`
   - Click delete/remove
   - Save changes
   - Wait for redeploy

2. **Add it again**:
   - Click "Add Environment Variable"
   - Key: `GROQ_API_KEY`
   - Value: (paste your key)
   - Save changes
   - Wait for redeploy

3. **Manual redeploy**:
   - Manual Deploy → Clear build cache & deploy

## Still Not Working?

Check the logs for the exact error message and share:
1. What the logs say (copy the error messages)
2. Whether `GROQ_API_KEY` appears in Environment tab
3. Whether the service status is "Live"

The detailed logging I added will show exactly what's happening!


