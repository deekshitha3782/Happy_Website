# Deployment Guide for Kind-Mind-AI

This guide will help you deploy the Kind-Mind-AI (Serenity AI) application to various hosting platforms.

## Prerequisites

Before deploying, ensure you have:

1. **PostgreSQL Database** - You'll need a PostgreSQL database instance
2. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
3. **Node.js 20+** - For local development and building

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL=postgresql://user:password@host:port/database
AI_INTEGRATIONS_OPENAI_API_KEY=your-openai-api-key-here
PORT=5000
NODE_ENV=production
```

See `.env.example` for a template.

## Database Setup

1. **Create a PostgreSQL database** (you can use services like):
   - [Supabase](https://supabase.com) (Free tier available)
   - [Neon](https://neon.tech) (Free tier available)
   - [Railway](https://railway.app) (Free tier available)
   - [Render](https://render.com) (Free tier available)
   - [ElephantSQL](https://www.elephantsql.com) (Free tier available)

2. **Run database migrations**:
   ```bash
   npm run db:push
   ```

## Deployment Options

### Option 1: Railway (Recommended - Easiest)

[Railway](https://railway.app) is a great platform for full-stack applications.

1. **Sign up** at [railway.app](https://railway.app)
2. **Create a new project** and select "Deploy from GitHub repo"
3. **Add PostgreSQL service**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically set `DATABASE_URL`
4. **Add environment variables**:
   - Go to your web service → "Variables"
   - Add `AI_INTEGRATIONS_OPENAI_API_KEY` with your OpenAI key
5. **Deploy**: Railway will automatically detect the Dockerfile and deploy

**Railway automatically:**
- Detects the Dockerfile
- Builds and deploys your app
- Provides a public URL
- Handles SSL certificates

---

### Option 2: Render

[Render](https://render.com) offers free hosting with PostgreSQL.

1. **Sign up** at [render.com](https://render.com)
2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Build Command: `npm ci && npm run build`
   - Start Command: `node dist/index.cjs`
   - Environment: `Node`
3. **Create a PostgreSQL database**:
   - New → PostgreSQL
   - Copy the Internal Database URL
4. **Add environment variables**:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `AI_INTEGRATIONS_OPENAI_API_KEY` - Your OpenAI API key
   - `NODE_ENV=production`
   - `PORT=10000` (Render uses port 10000)
5. **Deploy**: Render will build and deploy automatically

**Note**: You can also use the `render.yaml` file for infrastructure-as-code.

---

### Option 3: Docker Deployment (Any Platform)

The project includes a Dockerfile for containerized deployment.

#### Build the Docker image:
```bash
docker build -t kind-mind-ai .
```

#### Run locally:
```bash
docker run -p 5000:5000 \
  -e DATABASE_URL=your-database-url \
  -e AI_INTEGRATIONS_OPENAI_API_KEY=your-key \
  kind-mind-ai
```

#### Deploy to platforms that support Docker:
- **Fly.io**: `fly deploy`
- **DigitalOcean App Platform**: Connect GitHub repo
- **AWS ECS/Fargate**: Use the Dockerfile
- **Google Cloud Run**: `gcloud run deploy`
- **Azure Container Instances**: Use the Dockerfile

---

### Option 4: Vercel (Frontend) + Separate Backend

Since this is a full-stack app, you can split it:

1. **Deploy backend** to Railway/Render/Fly.io
2. **Deploy frontend** to Vercel:
   - Update API calls to point to your backend URL
   - Set up environment variables in Vercel

**Note**: This requires modifying the code to separate frontend/backend.

---

### Option 5: Self-Hosted (VPS)

For hosting on your own server (DigitalOcean, Linode, AWS EC2, etc.):

1. **Set up a VPS** with Ubuntu/Debian
2. **Install Node.js 20+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. **Install PostgreSQL**:
   ```bash
   sudo apt-get install postgresql postgresql-contrib
   ```
4. **Clone and build**:
   ```bash
   git clone your-repo-url
   cd Kind-Mind-AI
   npm ci
   npm run build
   ```
5. **Set up environment variables** in `.env`
6. **Run database migrations**: `npm run db:push`
7. **Use PM2** to keep the app running:
   ```bash
   npm install -g pm2
   pm2 start dist/index.cjs --name kind-mind-ai
   pm2 save
   pm2 startup
   ```
8. **Set up Nginx** as reverse proxy (optional but recommended)
9. **Set up SSL** with Let's Encrypt (Certbot)

---

## Post-Deployment Steps

1. **Run database migrations**:
   ```bash
   npm run db:push
   ```

2. **Verify environment variables** are set correctly

3. **Test the application**:
   - Visit your deployed URL
   - Try sending a message in the chat
   - Test voice call functionality

4. **Monitor logs** for any errors

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if your database allows connections from your hosting IP
- Ensure SSL is configured if required

### OpenAI API Issues
- Verify your API key is correct
- Check your OpenAI account has credits
- Verify the API key has proper permissions

### Build Failures
- Ensure Node.js version is 20+
- Check all dependencies are in `package.json`
- Review build logs for specific errors

### Port Issues
- Some platforms require specific ports (Render uses 10000)
- Update `PORT` environment variable accordingly

---

## Security Considerations

1. **Never commit** `.env` files to Git
2. **Use environment variables** for all secrets
3. **Enable HTTPS** (most platforms do this automatically)
4. **Set up rate limiting** if needed (consider adding to the Express app)
5. **Regularly update dependencies** for security patches

---

## Cost Estimates

### Free Tier Options:
- **Railway**: $5/month free credit
- **Render**: Free tier available (with limitations)
- **Supabase**: Free tier for database
- **Neon**: Free tier for database
- **OpenAI**: Pay-as-you-go (very affordable for low usage)

### Paid Options:
- **Railway**: ~$5-20/month depending on usage
- **Render**: ~$7/month for web service + database
- **VPS**: ~$5-10/month (DigitalOcean, Linode)

---

## Need Help?

If you encounter issues:
1. Check the application logs
2. Verify all environment variables are set
3. Ensure the database is accessible
4. Check OpenAI API key and credits

For platform-specific help, refer to their documentation:
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Docker Docs](https://docs.docker.com)

