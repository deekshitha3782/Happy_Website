# Keep Render Service Awake (Free Tier)

On Render's free tier, services spin down after 15 minutes of inactivity. When someone visits, they see a loading screen while the service wakes up (takes ~30-60 seconds).

## Solution: Use Free Uptime Monitoring

Use a free service to ping your health check endpoint every 10-14 minutes to keep it awake.

### Option 1: UptimeRobot (Recommended - Free)

1. Go to https://uptimerobot.com/
2. Sign up for a free account
3. Click "Add New Monitor"
4. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Kind Mind AI Keep-Alive
   - **URL**: `https://your-app-name.onrender.com/health`
   - **Monitoring Interval**: 5 minutes (free tier allows this)
5. Click "Create Monitor"

UptimeRobot will ping your `/health` endpoint every 5 minutes, keeping your service awake.

### Option 2: cron-job.org (Free)

1. Go to https://cron-job.org/
2. Sign up for a free account
3. Click "Create cronjob"
4. Configure:
   - **Title**: Keep Render Awake
   - **Address**: `https://your-app-name.onrender.com/health`
   - **Schedule**: Every 10 minutes (`*/10 * * * *`)
5. Save

### Option 3: GitHub Actions (Free)

If your code is on GitHub, you can use GitHub Actions:

1. Create `.github/workflows/keep-alive.yml`:
```yaml
name: Keep Render Awake

on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Health Endpoint
        run: |
          curl -f https://your-app-name.onrender.com/health || exit 1
```

## What We Added

1. **Health Check Endpoint** (`/health`): Fast endpoint that returns `{ status: "ok" }`
2. **Updated render.yaml**: Uses `/health` as the health check path
3. **Client-side check**: Automatically waits for service to be ready

## Note

Even with keep-alive, if the service does spin down, visitors will see Render's loading screen for ~30-60 seconds on first visit. This is a Render free tier limitation.

