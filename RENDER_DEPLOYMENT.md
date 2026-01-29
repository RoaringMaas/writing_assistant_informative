# Render Deployment Guide for Writing Assistant

This guide will walk you through deploying the Lower Primary Writing Assistant to Render.

## Prerequisites

1. A [Render account](https://render.com) (free tier available)
2. A [GitHub account](https://github.com) with this repository pushed
3. Access to Manus API keys for LLM functionality

## Step 1: Push Your Code to GitHub

If you haven't already, push your code to a GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/writing-assistant.git
git push -u origin main
```

## Step 2: Create a New Web Service on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** button in the top right
3. Select **"Web Service"**
4. Connect your GitHub account if not already connected
5. Select your `writing-assistant` repository
6. Configure the service:
   - **Name**: `writing-assistant` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
   - **Plan**: Free (or paid for better performance)

## Step 3: Create a MySQL Database

1. From Render Dashboard, click **"New +"** again
2. Select **"PostgreSQL"** (Note: Render doesn't offer MySQL, so we'll use PostgreSQL or you'll need an external MySQL provider)

### Option A: Use PostgreSQL on Render (Recommended)

1. Create a new PostgreSQL database
2. Name it `writing-assistant-db`
3. Choose the Free plan (or paid)
4. After creation, copy the **Internal Database URL**

**Important**: You'll need to update your database driver from `mysql2` to `pg` (PostgreSQL):

```bash
pnpm remove mysql2
pnpm add pg
```

And update `drizzle.config.ts` to use PostgreSQL dialect.

### Option B: Use External MySQL Database

Use a service like:
- [PlanetScale](https://planetscale.com/) (Free tier available)
- [Railway](https://railway.app/) (MySQL support)
- [AWS RDS](https://aws.amazon.com/rds/) (Paid)
- [DigitalOcean Managed Databases](https://www.digitalocean.com/products/managed-databases) (Paid)

Get your MySQL connection string from the provider.

## Step 4: Configure Environment Variables

In your Render Web Service settings, go to the **Environment** tab and add these variables:

### Required Variables:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-database-connection-string>
JWT_SECRET=<generate-a-random-32-character-string>
```

### Manus API Keys (for LLM functionality):

```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<your-manus-server-api-key>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<your-manus-frontend-api-key>
```

**To get Manus API keys:**
- Log in to your Manus account
- Go to Settings → API Keys
- Generate new keys for server-side and frontend use

### OAuth Configuration (if using authentication):

```
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=<your-manus-app-id>
```

### Application Settings:

```
VITE_APP_TITLE=Lower Primary Writing Assistant
VITE_APP_LOGO=/logo.svg
OWNER_OPEN_ID=<your-owner-id>
OWNER_NAME=<your-name>
```

### Analytics (optional):

```
VITE_ANALYTICS_ENDPOINT=<your-analytics-endpoint>
VITE_ANALYTICS_WEBSITE_ID=<your-website-id>
```

## Step 5: Update Build Command

In your Render Web Service settings, update the **Build Command** to include database migrations:

```bash
pnpm install && pnpm run build && pnpm run db:push
```

This will:
1. Install dependencies
2. Build the frontend and backend
3. Run database migrations

## Step 6: Deploy

1. Click **"Create Web Service"** or **"Manual Deploy"**
2. Render will start building and deploying your app
3. Monitor the logs for any errors
4. Once deployed, you'll get a URL like: `https://writing-assistant.onrender.com`

## Step 7: Verify Deployment

1. Visit your Render URL
2. Test the writing flow:
   - Start a new writing session
   - Enter a name and topic
   - Write a hook, body paragraphs, and conclusion
   - Check that scoring works (requires valid Manus API keys)
   - Test voice-to-text (requires HTTPS, which Render provides)
   - Test save/load functionality

## Troubleshooting

### Build Fails

**Error**: `pnpm: command not found`
- **Solution**: Render should auto-detect pnpm. If not, add to Build Command:
  ```bash
  npm install -g pnpm && pnpm install && pnpm run build
  ```

**Error**: Database connection fails
- **Solution**: Verify `DATABASE_URL` is correct and database is running
- Check that database allows connections from Render's IP addresses

### App Crashes on Start

**Error**: `Port already in use`
- **Solution**: Render automatically sets the `PORT` environment variable. Ensure your app uses `process.env.PORT`

**Error**: Missing environment variables
- **Solution**: Double-check all required environment variables are set in Render dashboard

### LLM Features Don't Work

**Error**: Scoring/feedback returns errors
- **Solution**: Verify `BUILT_IN_FORGE_API_KEY` is valid and has proper permissions
- Check Manus API quota/limits

### Database Migrations Fail

**Error**: `drizzle-kit` errors during build
- **Solution**: Ensure `DATABASE_URL` is accessible during build time
- You may need to run migrations manually after first deploy:
  ```bash
  # In Render Shell (available in dashboard)
  pnpm run db:push
  ```

## Using PostgreSQL Instead of MySQL

If using Render's PostgreSQL (recommended for simplicity), you'll need to:

1. **Update dependencies** in `package.json`:
   ```bash
   pnpm remove mysql2
   pnpm add pg
   ```

2. **Update Drizzle config** in `drizzle.config.ts`:
   ```typescript
   import { defineConfig } from "drizzle-kit";
   
   export default defineConfig({
     dialect: "postgresql", // Changed from "mysql"
     schema: "./drizzle/schema.ts",
     out: "./drizzle/migrations",
     dbCredentials: {
       url: process.env.DATABASE_URL!,
     },
   });
   ```

3. **Update schema** in `drizzle/schema.ts`:
   - Replace `mysqlTable` with `pgTable`
   - Update data types (e.g., `text("name")` instead of `varchar("name", { length: 255 })`)

4. **Regenerate migrations**:
   ```bash
   pnpm run db:push
   ```

## Cost Considerations

### Render Free Tier:
- Web Service: Free (spins down after 15 minutes of inactivity)
- PostgreSQL: Free (90-day expiration, 1GB storage)
- **Note**: Free tier has cold starts (30-60 seconds to wake up)

### Render Paid Plans:
- Starter: $7/month (always on, no cold starts)
- Standard: $25/month (more resources)
- Database: $7/month (persistent, no expiration)

## Alternative: Using render.yaml

For automated deployment, you can use the included `render.yaml` file:

1. Push `render.yaml` to your repository
2. In Render dashboard, click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will automatically create all services defined in `render.yaml`
5. You'll still need to manually set the `sync: false` environment variables

## Custom Domain

To use a custom domain:

1. Go to your Web Service settings
2. Click **"Custom Domain"**
3. Add your domain (e.g., `writing.yourdomain.com`)
4. Update your DNS records as instructed by Render
5. Render will automatically provision SSL certificate

## Monitoring & Logs

- **Logs**: Available in Render dashboard under your service
- **Metrics**: CPU, Memory, Request count (paid plans)
- **Alerts**: Set up email notifications for downtime

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- [GitHub Issues](https://github.com/YOUR_USERNAME/writing-assistant/issues)

---

**Need Help?** If you encounter issues, check the Render logs first, then refer to the troubleshooting section above.
