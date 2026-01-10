# How to Add Groq API Key - Step by Step Guide

## Step 1: Get Your Free Groq API Key

1. **Open your browser** and go to: **https://console.groq.com/keys**

2. **Sign Up** (if you don't have an account):
   - Click "Sign Up" or "Get Started" button
   - You can sign up with:
     - Your email address, OR
     - Your GitHub account (easiest!)
   - **No credit card required!** ✅

3. **Create API Key**:
   - Once logged in, you'll see the "API Keys" section
   - Click the **"Create API Key"** button
   - Give it a name (e.g., "Kind-Mind-AI" or "MyApp")
   - Click "Create"
   - **IMPORTANT**: Copy the key immediately! It starts with `gsk_...`
   - ⚠️ You won't be able to see it again, so save it somewhere safe

## Step 2: Add to Render (Your Hosting Platform)

1. **Go to Render Dashboard**:
   - Open: **https://dashboard.render.com**
   - Log in to your Render account

2. **Find Your Service**:
   - Click on your service name (probably called "kind-mind-ai" or similar)
   - Or go to: https://dashboard.render.com/web → Click your service

3. **Go to Environment Tab**:
   - In your service page, click on the **"Environment"** tab
   - It's in the top menu bar

4. **Add Environment Variable**:
   - Scroll down to the "Environment Variables" section
   - Click **"Add Environment Variable"** button
   - In the **"Key"** field, type: `GROQ_API_KEY`
   - In the **"Value"** field, paste your Groq API key (the one starting with `gsk_...`)
   - Click **"Save Changes"**

5. **Wait for Redeploy**:
   - Render will automatically redeploy your service (takes 2-3 minutes)
   - You'll see a notification that deployment is in progress
   - Wait until it says "Live" ✅

## Step 3: Test It!

1. **Go to your website** (your Render URL)
2. **Send a message** in the chat
3. **Check the response** - it should now be from a real LLM! 🎉

## Visual Guide

```
Render Dashboard
  └── Your Service (kind-mind-ai)
      └── Environment Tab
          └── Environment Variables Section
              └── Add Environment Variable
                  Key: GROQ_API_KEY
                  Value: gsk_your_actual_key_here
                  └── Save Changes
```

## Troubleshooting

**Problem**: "Still getting hardcoded responses"
- **Solution**: 
  1. Make sure you copied the FULL key (starts with `gsk_`)
  2. Check there are no extra spaces before/after the key
  3. Wait 3-5 minutes after saving for redeploy to complete
  4. Check Render logs to see if there are any errors

**Problem**: "Can't find Environment tab"
- **Solution**: Make sure you're in your Web Service, not the Database. The Environment tab is in the Web Service settings.

**Problem**: "Groq API error in logs"
- **Solution**: 
  1. Verify your API key is correct
  2. Check Groq console to make sure the key is active
  3. Try creating a new API key if needed

## Quick Links

- **Get Groq API Key**: https://console.groq.com/keys
- **Render Dashboard**: https://dashboard.render.com
- **Groq Documentation**: https://console.groq.com/docs

## That's It! 🎉

Once you add the key and Render redeploys, your app will use real AI responses from Groq's free LLM!

