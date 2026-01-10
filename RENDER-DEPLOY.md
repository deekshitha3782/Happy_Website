# Step-by-Step Render Deployment Guide

## Render Free Tier - Complete Setup

Follow these steps **one by one** to deploy your Kind-Mind-AI app for FREE on Render.

---

## Step 1: Create Render Account

1. Go to: https://render.com
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if required

**✅ Checkpoint:** You should see the Render dashboard

---

## Step 2: Create PostgreSQL Database (FREE)

1. In Render dashboard, click **"New +"** button
2. Select **"PostgreSQL"**
3. Configure:
   - **Name:** `kindmindai-db` (or any name you like)
   - **Database:** `kindmindai` (or any name)
   - **User:** `kindmindai` (or any name)
   - **Region:** Choose closest to you (US East is usually good)
   - **PostgreSQL Version:** 16 (latest)
   - **Plan:** **Free** (select this!)
4. Click **"Create Database"**
5. **Wait 2-3 minutes** for database to provision

**✅ Checkpoint:** Database status should show "Available"

---

## Step 3: Get Database Connection String

1. Click on your database name
2. Find **"Internal Database URL"** section
3. Click **"Copy"** button next to the Internal Database URL
4. **Save this URL** - you'll need it in Step 5
   - Format: `postgresql://user:password@host:5432/database`

**✅ Checkpoint:** You have copied the database URL

---

## Step 4: Get OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click **"Create new secret key"**
4. Name it: `Kind-Mind-AI`
5. Click **"Create secret key"**
6. **Copy the key immediately** (you won't see it again!)
7. **Save this key** - you'll need it in Step 5

**✅ Checkpoint:** You have copied your OpenAI API key

---

## Step 5: Create Web Service on Render

1. In Render dashboard, click **"New +"** button
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - If not connected, click **"Connect account"** and authorize Render
   - Select your repository: `Kind-Mind-AI` (or your repo name)
   - Click **"Connect"**
4. Configure the service:
   - **Name:** `kind-mind-ai` (or any name)
   - **Region:** Same as your database
   - **Branch:** `main` (or `master`)
   - **Root Directory:** (leave empty - it's the root)
   - **Runtime:** `Node`
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `node dist/index.cjs`
   - **Plan:** **Free** (select this!)

5. **Add Environment Variables:**
   Click **"Advanced"** → **"Add Environment Variable"** and add:

   **Variable 1:**
   - Key: `DATABASE_URL`
   - Value: (Paste the Internal Database URL from Step 3)

   **Variable 2:**
   - Key: `AI_INTEGRATIONS_OPENAI_API_KEY`
   - Value: (Paste your OpenAI API key from Step 4)

   **Variable 3:**
   - Key: `NODE_ENV`
   - Value: `production`

   **Variable 4:**
   - Key: `PORT`
   - Value: `10000` (Render free tier uses port 10000)

6. Click **"Create Web Service"**

**✅ Checkpoint:** Build should start automatically

---

## Step 6: Wait for Build and Deploy

1. Watch the build logs (they appear automatically)
2. Build takes **3-5 minutes** the first time
3. You'll see:
   - Installing dependencies
   - Building client
   - Building server
   - Deploying

**✅ Checkpoint:** Status should show "Live" with a green dot

---

## Step 7: Run Database Migration

After deployment is live, you need to create the database tables:

1. In your Web Service page, click **"Shell"** tab (or "Logs" → "Shell")
2. Or use Render CLI (if you have it installed):
   ```bash
   render run npm run db:push
   ```

**Alternative - Using Render Dashboard:**
1. Go to your Web Service
2. Click **"Shell"** button
3. Run: `npm run db:push`
4. Wait for success message

**✅ Checkpoint:** Database tables should be created

---

## Step 8: Test Your Application

1. Your app URL will be: `https://kind-mind-ai.onrender.com` (or your custom name)
2. Click the URL or copy it
3. Open in browser
4. You should see the **Serenity AI** homepage
5. Click **"Begin Your Journey"** or go to `/chat`
6. Try sending a message to test

**✅ Checkpoint:** App is working and responding!

---

## Troubleshooting

### Build Fails
- Check build logs for errors
- Ensure all environment variables are set
- Verify `package.json` has all dependencies

### Database Connection Error
- Verify `DATABASE_URL` is correct (Internal Database URL)
- Check database is "Available" status
- Ensure you're using Internal URL, not External

### App Shows Error
- Check logs in Render dashboard
- Verify OpenAI API key is correct
- Ensure database migration ran successfully

### Port Issues
- Render free tier uses port `10000`
- Make sure `PORT=10000` is set in environment variables

---

## Free Tier Limitations

Render Free Tier:
- ✅ **Free forever** (no credit card needed)
- ⚠️ Services spin down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes ~30 seconds (cold start)
- ⚠️ 750 hours/month free (enough for always-on if you want)

**Note:** After 15 min inactivity, first request is slow, then it's fast.

---

## Success! 🎉

Your Kind-Mind-AI app is now live and free on Render!

**Next Steps:**
- Share your URL with others
- Customize the app further
- Monitor usage in Render dashboard

---

## Need Help?

- Render Docs: https://render.com/docs
- Render Support: support@render.com
- Check application logs in Render dashboard

