# Troubleshooting Chat Not Working

## Steps to Debug

### 1. Check Render Logs

1. Go to your Render Web Service dashboard
2. Click **"Logs"** tab
3. Try sending a message in the chat
4. Look for these log messages:
   - `POST /api/messages - Received request`
   - `POST /api/messages - Input validated`
   - `POST /api/messages - User message saved`
   - `POST /api/messages - Calling OpenAI API...`
   - `POST /api/messages - OpenAI response received`
   - `POST /api/messages - Assistant message saved`

### 2. Common Issues

#### Issue: "OpenAI API key is not configured"
**Solution:**
- Go to Render → Your Web Service → Environment
- Check if `AI_INTEGRATIONS_OPENAI_API_KEY` is set
- Make sure it's your actual OpenAI API key (starts with `sk-`)
- Save and redeploy

#### Issue: Database Connection Errors
**Solution:**
- Check if `DATABASE_URL` is set correctly
- Make sure it's the **Internal Database URL** (not External)
- Verify database and web service are in the **same region**

#### Issue: "Failed to fetch messages" or Network Errors
**Solution:**
- Open browser Developer Tools (F12)
- Go to **Console** tab
- Look for red error messages
- Go to **Network** tab
- Try sending a message
- Check if `/api/messages` request shows error (red)
- Share the error message

### 3. Verify Environment Variables

In Render dashboard, make sure these are set:

1. `DATABASE_URL` = (Internal Database URL from PostgreSQL)
2. `AI_INTEGRATIONS_OPENAI_API_KEY` = (Your OpenAI API key - starts with `sk-`)
3. `NODE_ENV` = `production`
4. `PORT` = `10000`

### 4. Test API Directly

You can test the API directly:

1. Get your app URL: `https://your-app.onrender.com`
2. Test GET messages:
   ```
   https://your-app.onrender.com/api/messages
   ```
   Should return JSON array of messages

3. Test POST message (use browser console or Postman):
   ```javascript
   fetch('https://your-app.onrender.com/api/messages', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       role: 'user',
       content: 'Hello, test message'
     })
   }).then(r => r.json()).then(console.log)
   ```

### 5. Check Browser Console

1. Open your website
2. Press F12 to open Developer Tools
3. Go to **Console** tab
4. Try sending a message
5. Look for any red error messages
6. Share the errors you see

### 6. Common Error Messages

- **"Failed to send message"** → Check Render logs for detailed error
- **"Network error"** → Check if app is running (might be spinning up)
- **"CORS error"** → Shouldn't happen (same origin), but check logs
- **"500 Internal Server Error"** → Check Render logs for details

---

## Quick Fixes

### If OpenAI API Key is Wrong:
1. Get new key from https://platform.openai.com/api-keys
2. Update in Render → Environment Variables
3. Redeploy

### If Database Connection Fails:
1. Check `DATABASE_URL` is Internal Database URL
2. Verify database is "Available" status
3. Ensure same region as web service

### If Nothing Works:
1. Check Render logs for specific errors
2. Share the error messages with me
3. I'll help fix them!

---

## Need Help?

Share:
1. Error messages from Render logs
2. Error messages from browser console (F12)
3. What happens when you try to send a message


