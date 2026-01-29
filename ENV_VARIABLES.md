# Environment Variables Reference

This document lists all environment variables needed for the Writing Assistant application.

## Required Environment Variables

### Database Configuration
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL/PostgreSQL connection string | `mysql://user:pass@host:3306/db` |

### Authentication & Security
| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token signing | `your-random-32-char-secret` |
| `OAUTH_SERVER_URL` | Manus OAuth server URL | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL | `https://login.manus.im` |
| `VITE_APP_ID` | Manus application ID | `your-app-id` |

### Manus API Keys (Required for LLM features)
| Variable | Description | Example |
|----------|-------------|---------|
| `BUILT_IN_FORGE_API_URL` | Manus API base URL (server-side) | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | Manus API key (server-side) | `your-server-api-key` |
| `VITE_FRONTEND_FORGE_API_URL` | Manus API base URL (frontend) | `https://api.manus.im` |
| `VITE_FRONTEND_FORGE_API_KEY` | Manus API key (frontend) | `your-frontend-api-key` |

### Application Settings
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_APP_TITLE` | Application title | `Lower Primary Writing Assistant` |
| `VITE_APP_LOGO` | Logo path | `/logo.svg` |
| `OWNER_OPEN_ID` | Owner's OpenID | `your-open-id` |
| `OWNER_NAME` | Owner's name | `Your Name` |

### Server Configuration
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` or `development` |
| `PORT` | Server port | `3000` |

## Optional Environment Variables

### Analytics (Optional)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ANALYTICS_ENDPOINT` | Analytics endpoint URL | `https://analytics.example.com` |
| `VITE_ANALYTICS_WEBSITE_ID` | Website ID for analytics | `your-website-id` |

## How to Get Manus API Keys

The application requires Manus API keys for LLM-powered features (scoring, feedback, word bank generation). Here's how to obtain them:

1. **Log in to Manus**: Visit [https://manus.im](https://manus.im) and log in
2. **Go to Settings**: Click on your profile → Settings
3. **Navigate to API Keys**: Find the API Keys section
4. **Generate Keys**: Create two separate keys:
   - **Server-side key**: For `BUILT_IN_FORGE_API_KEY` (has full permissions)
   - **Frontend key**: For `VITE_FRONTEND_FORGE_API_KEY` (limited permissions)
5. **Copy and Save**: Store these keys securely

## Setting Environment Variables

### For Local Development

Create a `.env` file in the project root (never commit this file):

```bash
DATABASE_URL=mysql://user:password@localhost:3306/writing_assistant
JWT_SECRET=your-random-secret-here
BUILT_IN_FORGE_API_KEY=your-manus-api-key
VITE_FRONTEND_FORGE_API_KEY=your-manus-frontend-key
# ... add other variables
```

### For Render Deployment

1. Go to your Render dashboard
2. Select your Web Service
3. Click on **Environment** tab
4. Add each variable using the **Add Environment Variable** button
5. Click **Save Changes**

### For Other Platforms

- **Vercel**: Use the Environment Variables section in project settings
- **Netlify**: Use the Environment variables section in site settings
- **Railway**: Use the Variables tab in your project
- **Heroku**: Use `heroku config:set VARIABLE_NAME=value`

## Security Best Practices

1. **Never commit** `.env` files to version control
2. **Use different keys** for development and production
3. **Rotate keys regularly** (every 90 days recommended)
4. **Limit key permissions** to only what's needed
5. **Monitor API usage** to detect unauthorized access

## Troubleshooting

### Missing Environment Variables

If you see errors about missing environment variables:

1. Check that all required variables are set
2. Restart your server after adding new variables
3. Verify variable names match exactly (case-sensitive)

### Invalid API Keys

If LLM features don't work:

1. Verify your Manus API keys are valid
2. Check that keys have proper permissions
3. Ensure you're not exceeding API rate limits
4. Confirm `BUILT_IN_FORGE_API_URL` is correct

### Database Connection Issues

If database connection fails:

1. Verify `DATABASE_URL` format is correct
2. Check that database server is running
3. Ensure database user has proper permissions
4. Confirm firewall allows connections

## Environment Variable Checklist

Use this checklist when deploying:

- [ ] `DATABASE_URL` - Database connection string
- [ ] `JWT_SECRET` - Random secret for JWT signing
- [ ] `BUILT_IN_FORGE_API_KEY` - Manus server API key
- [ ] `BUILT_IN_FORGE_API_URL` - Manus API URL
- [ ] `VITE_FRONTEND_FORGE_API_KEY` - Manus frontend API key
- [ ] `VITE_FRONTEND_FORGE_API_URL` - Manus API URL
- [ ] `NODE_ENV` - Set to `production`
- [ ] `PORT` - Server port (auto-set by most platforms)
- [ ] `VITE_APP_TITLE` - Application title
- [ ] `VITE_APP_LOGO` - Logo path

Optional:
- [ ] `OAUTH_SERVER_URL` - If using authentication
- [ ] `VITE_OAUTH_PORTAL_URL` - If using authentication
- [ ] `VITE_APP_ID` - If using authentication
- [ ] `OWNER_OPEN_ID` - Owner identification
- [ ] `OWNER_NAME` - Owner name
- [ ] `VITE_ANALYTICS_ENDPOINT` - If using analytics
- [ ] `VITE_ANALYTICS_WEBSITE_ID` - If using analytics
