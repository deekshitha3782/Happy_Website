# GitHub Repository Setup

## Step 1: Create GitHub Repository

1. Go to: **https://github.com/new**
2. Sign in with your GitHub account (deekshitha3782)
3. Fill in:
   - **Repository name:** `Kind-Mind-AI` (or any name you like)
   - **Description:** "Serenity AI - Mental Health Support Chat Application"
   - **Visibility:** Choose **Public** (free) or **Private** (if you have GitHub Pro)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

## Step 2: Add GitHub Remote

After creating the repository, GitHub will show you commands. Use these commands:

**If you're starting fresh:**
```bash
git remote add origin https://github.com/deekshitha3782/Kind-Mind-AI.git
git branch -M main
git push -u origin main
```

**If you already have a remote (like gitsafe-backup), you can either:**
- Remove the old remote and add GitHub:
  ```bash
  git remote remove gitsafe-backup
  git remote add origin https://github.com/deekshitha3782/Kind-Mind-AI.git
  git push -u origin main
  ```

- Or add GitHub as a new remote with a different name:
  ```bash
  git remote add github https://github.com/deekshitha3782/Kind-Mind-AI.git
  git push -u github main
  ```

## Step 3: Push Your Code

Once the remote is added, push your code:
```bash
git push -u origin main
```

You may be prompted for GitHub credentials. Use:
- **Username:** deekshitha3782
- **Password:** Use a **Personal Access Token** (not your GitHub password)

### How to Create Personal Access Token:

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name it: "Render Deployment"
4. Select scopes: **repo** (full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

---

## After Pushing to GitHub

Once your code is on GitHub, you can proceed with Render deployment:

1. Go to **Render.com**
2. Create a new **Web Service**
3. Connect your **GitHub repository**
4. Follow the deployment steps in **DEPLOY-STEPS.md**

---

## Quick Commands Summary

```bash
# Navigate to project
cd "C:\Users\Deekshitha\Desktop\Deekshitha\speech_app\Kind-Mind-AI"

# Add GitHub remote (replace with your actual repo URL)
git remote add origin https://github.com/deekshitha3782/REPO_NAME.git

# Push to GitHub
git push -u origin main
```

---

## Need Help?

- GitHub Docs: https://docs.github.com
- Creating a repo: https://docs.github.com/en/get-started/quickstart/create-a-repo

