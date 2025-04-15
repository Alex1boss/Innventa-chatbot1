#!/bin/bash

# This script fixes common deployment issues on Render
echo "Running Render deployment fix script..."

# Step 1: Check if we're on Render
if [ -z "$RENDER" ]; then
  echo "This script should be run on Render only."
  exit 1
fi

# Step 2: Check for environment variables
echo "Checking for required environment variables..."
MISSING_KEYS=()

if [ -z "$OPENAI_API_KEY" ]; then
  MISSING_KEYS+=("OPENAI_API_KEY")
fi

if [ -z "$GEMINI_API_KEY" ]; then
  MISSING_KEYS+=("GEMINI_API_KEY")
fi

if [ ${#MISSING_KEYS[@]} -gt 0 ]; then
  echo "⚠️ Missing environment variables: ${MISSING_KEYS[*]}"
  echo "Please add these in the Render dashboard under Environment Variables."
else
  echo "✅ All required environment variables are set."
fi

# Step 3: Fix package.json for Render compatibility
echo "Fixing package.json for Render compatibility..."
if [ -f "package.json.render" ]; then
  cp package.json.render package.json
  echo "✅ Updated package.json with Render-compatible version."
else
  echo "❌ Could not find package.json.render file."
  # Create a minimal fix to package.json
  sed -i 's/"type": "module"/"type": "commonjs"/g' package.json
  echo "Applied minimal fix to package.json."
fi

# Step 4: Ensure server.js exists
if [ ! -f "server.js" ]; then
  echo "❌ server.js file is missing, can't start the server."
  exit 1
else
  echo "✅ Found server.js file."
fi

# Step 5: Build the application
echo "Building the application..."
npm run build

# Step 6: Start the server
echo "Starting the server..."
node server.js