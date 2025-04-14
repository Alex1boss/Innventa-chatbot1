#!/bin/bash
# Script to start the application in production mode with keepalive monitoring

# Build the project
echo "Building the application..."
npm run build

# Start the server in the background
echo "Starting the server..."
NODE_ENV=production node dist/index.js &
SERVER_PID=$!

# Wait a few seconds for the server to initialize
echo "Waiting for server to initialize..."
sleep 10

# Start the keepalive monitor
echo "Starting keepalive monitoring..."
node keepalive.js &
KEEPALIVE_PID=$!

# Function to handle script termination and cleanup
cleanup() {
  echo "Shutting down..."
  kill $SERVER_PID
  kill $KEEPALIVE_PID
  exit 0
}

# Trap signals to properly clean up
trap cleanup SIGINT SIGTERM

echo "Application is running with keepalive monitoring"
echo "Press Ctrl+C to stop"

# Keep script running
while true; do
  sleep 60
done