# Render Deployment Checklist

Follow these steps to deploy your Writing Assistant to Render.

## ✅ Pre-Deployment Checklist

- [ ] Code is pushed to GitHub repository
- [ ] Build process works locally (`pnpm run build`)
- [ ] All environment variables documented
- [ ] Database provider selected (PostgreSQL on Render or external MySQL)
- [ ] Manus API keys obtained

## 📋 Step-by-Step Deployment

### 1. Push to GitHub (5 minutes)

```bash
git init
git add .
git commit -m "Ready for Render deployment"
git remote add origin https://github.com/YOUR_USERNAME/writing-assistant.git
git push -u origin main
```

### 2. Create Render Account (2 minutes)

- Go to [render.com](https://render.com)
- Sign up with GitHub (recommended)
- Verify your email

### 3. Set Up Database (5 minutes)

**Option A: PostgreSQL on Render (Recommended)**
1. Click "New +" → "PostgreSQL"
2. Name: `writing-assistant-db`
3. Database: `writing_assistant`
4. Plan: Free (or Starter for production)
5. Click "Create Database"
6. Copy the **Internal Database URL**

**Option B: External MySQL**
- Use PlanetScale, Railway, or AWS RDS
- Get your connection string
- Skip to step 4

### 4. Create Web Service (10 minutes)

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select `writing-assistant` repo
4. Configure:
   - **Name**: `writing-assistant`
   - **Region**: Choose closest to users
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && pnpm run build && pnpm run db:push`
   - **Start Command**: `pnpm start`
   - **Plan**: Free (or Starter for always-on)

### 5. Add Environment Variables (10 minutes)

Go to Environment tab and add these variables:

**Essential (Required):**
```
NODE_ENV=production
DATABASE_URL=<paste-database-url-from-step-3>
JWT_SECRET=<generate-random-32-char-string>
```

**Manus API Keys (Required for LLM features):**
```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<your-manus-server-key>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<your-manus-frontend-key>
```

**Application Settings:**
```
VITE_APP_TITLE=Lower Primary Writing Assistant
VITE_APP_LOGO=/logo.svg
```

**Optional (for authentication):**
```
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=<your-app-id>
OWNER_OPEN_ID=<your-id>
OWNER_NAME=<your-name>
```

### 6. Deploy (5 minutes)

1. Click "Create Web Service"
2. Wait for build to complete (5-10 minutes)
3. Monitor logs for errors
4. Once deployed, you'll get a URL like: `https://writing-assistant.onrender.com`

### 7. Test Deployment (10 minutes)

Visit your Render URL and test:

- [ ] Homepage loads correctly
- [ ] Can start a new writing session
- [ ] Can enter name and topic
- [ ] Can write hook, body paragraphs, conclusion
- [ ] Scoring works (requires valid Manus API keys)
- [ ] Voice-to-text works (requires HTTPS ✓)
- [ ] Save/Load functionality works
- [ ] Certificate generation works

## 🔧 If Using PostgreSQL Instead of MySQL

Your app currently uses MySQL. To use Render's PostgreSQL:

1. **Update dependencies:**
   ```bash
   pnpm remove mysql2
   pnpm add pg
   ```

2. **Update `drizzle.config.ts`:**
   ```typescript
   dialect: "postgresql", // Change from "mysql"
   ```

3. **Update `drizzle/schema.ts`:**
   - Replace `mysqlTable` with `pgTable`
   - Update column types as needed

4. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Switch to PostgreSQL"
   git push
   ```

5. Render will auto-deploy the changes

## 🚨 Common Issues & Solutions

### Build Fails

**Issue**: `pnpm: command not found`
**Fix**: Update Build Command to:
```bash
npm install -g pnpm && pnpm install && pnpm run build && pnpm run db:push
```

### Database Connection Fails

**Issue**: Can't connect to database
**Fix**: 
- Verify `DATABASE_URL` is correct
- Ensure database is running
- Check database allows external connections

### App Crashes on Start

**Issue**: Port errors or missing variables
**Fix**:
- Render sets `PORT` automatically (don't hardcode)
- Verify all required environment variables are set

### LLM Features Don't Work

**Issue**: Scoring/feedback returns errors
**Fix**:
- Verify `BUILT_IN_FORGE_API_KEY` is valid
- Check Manus API quota/limits
- Ensure API URL is correct

## 💰 Cost Estimate

### Free Tier (Good for testing):
- Web Service: Free (spins down after 15 min inactivity)
- PostgreSQL: Free (90-day limit, 1GB)
- **Total**: $0/month
- **Note**: 30-60 second cold starts

### Paid Tier (Recommended for production):
- Web Service Starter: $7/month (always on)
- PostgreSQL Starter: $7/month (persistent)
- **Total**: $14/month
- **Benefits**: No cold starts, better performance

## 🎯 Post-Deployment

After successful deployment:

- [ ] Add custom domain (optional)
- [ ] Set up monitoring/alerts
- [ ] Configure auto-deploy from GitHub
- [ ] Test with real users
- [ ] Monitor logs for errors
- [ ] Set up backups (paid plans)

## 📚 Additional Resources

- **Full Guide**: See `RENDER_DEPLOYMENT.md` for detailed instructions
- **Environment Variables**: See `ENV_VARIABLES.md` for complete reference
- **Render Docs**: https://render.com/docs
- **Support**: https://community.render.com/

## ⏱️ Total Time Estimate

- First-time deployment: **45-60 minutes**
- Subsequent deployments: **5-10 minutes** (automatic)

---

**Need Help?** Check the full deployment guide in `RENDER_DEPLOYMENT.md` or open an issue on GitHub.
