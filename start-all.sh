#!/bin/bash
# This script starts the application with all monitoring systems for 24/7 availability

echo "====================================================="
echo "  Innventa AI Chatbot - 24/7 Startup Script"
echo "====================================================="

# Check if the API keys are configured
if [ -z "$OPENAI_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
  echo "⚠️  WARNING: No API keys found in environment variables."
  echo "   Please configure at least one of these in Replit Secrets:"
  echo "   - OPENAI_API_KEY"
  echo "   - GEMINI_API_KEY"
  echo ""
else
  if [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OpenAI API key configured"
  fi
  if [ -n "$GEMINI_API_KEY" ]; then
    echo "✅ Gemini API key configured"
  fi
  echo ""
fi

# Start the main application in the background
echo "🚀 Starting application server..."
npm run dev &
APP_PID=$!

# Wait for server to start up
echo "⏳ Waiting for server to initialize..."
sleep 10

# Start internal monitoring in the background
echo "🔄 Starting internal monitoring system (keepalive.js)..."
node keepalive.js > keepalive.log 2>&1 &
KEEPALIVE_PID=$!

# Start external monitoring in the background
echo "🌐 Starting external monitoring system (external-monitoring.js)..."
node external-monitoring.js > external-monitoring.log 2>&1 &
EXTERNAL_PID=$!

# Show process information
echo ""
echo "📊 Process Information:"
echo "---------------------------------------------------"
echo "Application Server PID: $APP_PID"
echo "Internal Monitor PID:   $KEEPALIVE_PID"
echo "External Monitor PID:   $EXTERNAL_PID"
echo "---------------------------------------------------"
echo ""
echo "✅ All systems are running!"
echo "📝 Monitor logs can be found in keepalive.log and external-monitoring.log"
echo ""
echo "The Innventa AI Chatbot is now running 24/7."
echo "Use 'ps aux | grep node' to see all running processes."
echo "====================================================="

# Keep script running
wait $APP_PID