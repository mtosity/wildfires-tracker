#!/bin/bash

# Copy client files to root for build
echo "Copying client files..."
cp -r client/src .
cp client/index.html .

echo "Files in root directory:"
ls -la

echo "Building with Vite..."
npx vite build

echo "Creating public directory..."
mkdir -p public

echo "Copying build files..."
cp -r dist/* public/
cp -r client/public/* public/

echo "Cleaning up temporary files..."
rm -rf src index.html

echo "Build complete!"
