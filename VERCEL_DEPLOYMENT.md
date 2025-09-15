# Vercel Deployment Guide

This guide will help you deploy your Wildfire Tracker application to Vercel with GitHub integration.

## Prerequisites

1. A GitHub account with your project repository
2. A Vercel account (sign up at vercel.com)
3. Environment variables configured

## Step 1: Connect GitHub Repository to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it as a Vite project
5. Configure the following settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `public`

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# For production deployment
vercel --prod
```

## Step 2: Configure Environment Variables

In your Vercel project dashboard, go to Settings → Environment Variables and add:

### Required Environment Variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NASA_FIRMS_API_KEY`: Your NASA FIRMS API key  
- `VITE_MAPBOX_ACCESS_TOKEN`: Your Mapbox access token

### For each variable:
1. Click "Add New"
2. Enter the variable name
3. Enter the value
4. Select environments (Production, Preview, Development)
5. Click "Save"

## Step 3: Configure GitHub Secrets (for GitHub Actions)

In your GitHub repository, go to Settings → Secrets and Variables → Actions:

### Add Repository Secrets:
- `VERCEL_TOKEN`: Get from Vercel → Settings → Tokens
- `VERCEL_ORG_ID`: Found in your Vercel team settings
- `VERCEL_PROJECT_ID`: Found in your project settings
- `DATABASE_URL`: Your database connection string
- `NASA_FIRMS_API_KEY`: Your NASA API key
- `VITE_MAPBOX_ACCESS_TOKEN`: Your Mapbox token

### To get Vercel IDs:
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project (run in your project directory)
vercel link

# This creates .vercel/project.json with your IDs
cat .vercel/project.json
```

## Step 4: Automatic Deployments

Once configured, your app will automatically deploy:
- **Production**: When you push to `main` or `master` branch
- **Preview**: When you create a pull request

## Step 5: Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Go to Settings → Domains
3. Add your custom domain
4. Configure DNS records as instructed

## Build Configuration

The project uses these build settings:

```json
{
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "./public",
  "functions": {
    "api/index.ts": {
      "maxDuration": 30
    }
  }
}
```

## API Routes

All API routes are handled by `/api/index.ts` which serves as a serverless function entry point.

## Troubleshooting

### Common Issues:

1. **Build fails**: Check environment variables are set correctly
2. **API routes not working**: Ensure `api/index.ts` is properly configured
3. **Database connection fails**: Verify `DATABASE_URL` is correct
4. **Maps not loading**: Check `VITE_MAPBOX_ACCESS_TOKEN` is valid

### Vercel Logs:
- Check Functions tab in Vercel dashboard for API errors
- Use `vercel logs` CLI command for real-time logs

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [GitHub Actions for Vercel](https://github.com/amondnet/vercel-action)
