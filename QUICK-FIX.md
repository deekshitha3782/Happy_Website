# Quick Fix Guide - Chat Not Responding

## Most Common Issues & Fixes

### Issue 1: OpenAI API Key Not Set
**Symptoms:** Error message about "OpenAI API key is not configured"

**Fix:**
1. Go to Render → Your Web Service → Environment
2. Check `AI_INTEGRATIONS_OPENAI_API_KEY`
3. Make sure it starts with `sk-` and is your actual key
4. If missing/wrong, update it and redeploy

### Issue 2: Database Connection Failed
**Symptoms:** Error about database connection or "Failed to fetch messages"

**Fix:**
1. Go to Render → Your Web Service → Environment
2. Check `DATABASE_URL`
3. Make sure it's the **Internal Database URL** (not External)
4. Format: `postgresql://user:password@host:5432/database`
5. Verify database is "Available" status

### Issue 3: App Spinning Up (Cold Start)
**Symptoms:** Request takes 30+ seconds, then works

**Fix:**
- This is normal on free tier
- Wait 30 seconds after first request
- Subsequent requests are fast

### Issue 4: Check Render Logs
**How to:**
1. Render → Your Web Service → Logs tab
2. Try sending a message
3. Look for error messages in red
4. Share the errors with me

---

## What I Just Added

✅ Error messages now show in the UI (toast notifications)
✅ Better error logging in the backend
✅ Detailed error messages to help diagnose

---

## Next Steps

1. **Wait for Render to redeploy** (automatic, ~2-3 minutes)
2. **Try sending a message again**
3. **If you see an error toast**, it will tell you what's wrong
4. **Check Render logs** for detailed error messages
5. **Share the error** with me and I'll help fix it

---

## Test Your API Directly

Open browser console (F12) and run:

```javascript
// Test GET messages
fetch('/api/messages')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Test POST message
fetch('/api/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role: 'user', content: 'Hello test' })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

This will show you the exact error!

