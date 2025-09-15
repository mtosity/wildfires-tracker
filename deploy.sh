#!/bin/bash

# Vercel Deployment Script
# Run this script to deploy to Vercel

echo "🚀 Starting Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist public

# Run build
echo "🔨 Building application..."
npm run build:vercel

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel
    echo "🚀 Deploying to Vercel..."
    
    if [ "$1" = "prod" ] || [ "$1" = "production" ]; then
        echo "📦 Deploying to production..."
        vercel --prod
    else
        echo "🔍 Deploying preview..."
        vercel
    fi
    
    echo "✅ Deployment complete!"
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi
