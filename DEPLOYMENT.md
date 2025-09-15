# Deployment Guide

This guide covers deploying the FireTracker application to Vercel (recommended) or using a split deployment with Vercel frontend + AWS backend.

## Option A: Full Vercel Deployment (Recommended)

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: You'll need a hosted PostgreSQL instance (recommended: Neon, Supabase, or Vercel Postgres)
3. **NASA FIRMS API Key**: Get from [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/)

### Step 1: Database Setup

Choose one of these PostgreSQL providers:

#### Option 1: Vercel Postgres (Easiest)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Create Postgres database
vercel postgres create
```

#### Option 2: Neon (Recommended for production)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

#### Option 3: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database and copy the connection string

### Step 2: Environment Variables

Set up environment variables in Vercel dashboard or CLI:

```bash
# Set environment variables via Vercel CLI
vercel env add DATABASE_URL
vercel env add NASA_FIRMS_API_KEY

# Or add via Vercel dashboard:
# Go to Project Settings > Environment Variables
```

Required environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NASA_FIRMS_API_KEY`: Your NASA FIRMS API key

### Step 3: Deploy

#### Method 1: Vercel CLI
```bash
# Install dependencies
npm install

# Build the project
npm run build:vercel

# Deploy
vercel --prod
```

#### Method 2: GitHub Integration
1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Connect your GitHub repository
4. Set environment variables in Vercel dashboard
5. Deploy automatically on push

### Step 4: Database Migration

After deployment, push your database schema:

```bash
# Set DATABASE_URL in your local .env file
echo \"DATABASE_URL=your_production_database_url\" > .env

# Push schema to production database
npm run db:push

# Seed with initial data (optional)
npm run db:seed
```

## Option B: Split Deployment (Vercel Frontend + AWS Backend)

If you prefer to host the backend separately on AWS, follow this approach:

### Frontend (Vercel)

1. **Create a separate frontend build**:

```bash
# Build only the frontend
npm run build:client
```

2. **Deploy to Vercel**:
   - Import only the `client/dist` folder to Vercel
   - Set `VITE_API_URL` environment variable to your AWS backend URL

### Backend (AWS)

#### Option 1: AWS Lambda + API Gateway

1. **Install AWS CLI and configure**:
```bash
npm install -g aws-cdk
aws configure
```

2. **Create AWS CDK project**:
```bash
mkdir aws-backend
cd aws-backend
cdk init app --language typescript
```

3. **Modify the server code** to work with Lambda:
   - Wrap Express app with `serverless-express`
   - Handle cold starts appropriately

#### Option 2: AWS ECS/EC2

1. **Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:server

EXPOSE 5000
CMD [\"npm\", \"start\"]
```

2. **Deploy to ECS**:
   - Build and push Docker image to ECR
   - Create ECS service with the image
   - Configure Application Load Balancer

## Configuration Changes Made

The following changes were made to remove Replit dependencies:

### 1. Removed Replit packages from package.json:
- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-shadcn-theme-json`
- `@replit/vite-plugin-runtime-error-modal`

### 2. Updated vite.config.ts:
- Removed Replit-specific plugins
- Simplified Vite configuration

### 3. Cleaned up client/index.html:
- Removed Replit dev banner script

### 4. Updated package.json scripts:
- Added `build:vercel` for Vercel-specific builds
- Split build commands for better control

### 5. Created Vercel configuration:
- `vercel.json` for deployment settings
- `api/index.ts` for serverless function entry point

## Post-Deployment Steps

1. **Verify deployment**:
   - Check that the frontend loads correctly
   - Test API endpoints
   - Verify database connectivity

2. **Set up monitoring**:
   - Configure error tracking (Sentry, etc.)
   - Set up uptime monitoring
   - Monitor database performance

3. **Configure domain** (optional):
   - Add custom domain in Vercel dashboard
   - Update CORS settings if needed

## Troubleshooting

### Common Issues:

1. **Database connection errors**:
   - Verify DATABASE_URL format
   - Check network access (some providers require whitelisting)
   - Ensure SSL is configured if required

2. **Build failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

3. **API timeouts**:
   - Increase function timeout in vercel.json
   - Optimize database queries
   - Consider using connection pooling

4. **CORS issues**:
   - Configure CORS headers in server routes
   - Update frontend API URLs

### Environment-Specific Notes:

- **Vercel Functions**: Have a 10-second timeout on Hobby plan, 30 seconds on Pro
- **Database**: Consider connection pooling for serverless environments
- **NASA FIRMS API**: Has rate limits; implement proper caching

## Development vs Production

### Development:
```bash
npm run dev  # Runs both client and server locally
```

### Production:
- Frontend: Static files served by Vercel CDN
- Backend: Serverless functions or AWS infrastructure
- Database: Managed PostgreSQL service