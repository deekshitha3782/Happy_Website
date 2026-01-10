# Quick Start - Deploy Kind-Mind-AI

## Fastest Deployment (Railway - ~5 minutes)

1. **Sign up** at [railway.app](https://railway.app) (free $5 credit)

2. **Create New Project** → "Deploy from GitHub repo"
   - Connect your GitHub repository

3. **Add PostgreSQL Database**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically sets `DATABASE_URL`

4. **Add Environment Variables**:
   - Go to your web service → "Variables" tab
   - Add: `AI_INTEGRATIONS_OPENAI_API_KEY` = `your-openai-key`
   - Get OpenAI key from: https://platform.openai.com/api-keys

5. **Deploy**:
   - Railway auto-detects Dockerfile
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://your-app.railway.app`

6. **Run Database Migration**:
   ```bash
   # In Railway, go to your web service → "Deployments" → "View Logs"
   # Or use Railway CLI:
   railway run npm run db:push
   ```

**Done!** Your app is now live. 🎉

---

## Alternative: Render (Free Tier)

1. **Sign up** at [render.com](https://render.com)

2. **Create Web Service**:
   - Connect GitHub repo
   - Build: `npm ci && npm run build`
   - Start: `node dist/index.cjs`
   - Environment: `Node`

3. **Create PostgreSQL Database**:
   - New → PostgreSQL
   - Copy the "Internal Database URL"

4. **Add Environment Variables**:
   - `DATABASE_URL` = (from step 3)
   - `AI_INTEGRATIONS_OPENAI_API_KEY` = (your OpenAI key)
   - `NODE_ENV` = `production`
   - `PORT` = `10000`

5. **Deploy** and run migrations (same as Railway step 6)

---

## Required Setup

### 1. Get OpenAI API Key
- Visit: https://platform.openai.com/api-keys
- Create a new secret key
- Copy it (you'll need it for deployment)

### 2. Database Options (Free Tier)
- **Supabase**: https://supabase.com (free PostgreSQL)
- **Neon**: https://neon.tech (free PostgreSQL)
- **Railway**: Included when you deploy there
- **Render**: Included when you deploy there

### 3. Database Migration
After deployment, run:
```bash
npm run db:push
```

This creates the messages table in your database.

---

## Testing Locally First (Optional)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   - Copy `env.example` to `.env`
   - Fill in your `DATABASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`

3. **Run database migration**:
   ```bash
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Visit**: http://localhost:5000

---

## Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Verify all environment variables are set
- Check application logs for errors
- Ensure database is accessible from your hosting platform

